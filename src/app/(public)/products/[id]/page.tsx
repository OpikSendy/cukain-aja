/**
 * app/(public)/products/[id]/page.tsx — Product Detail (RSC)
 */
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ProductImageGallery } from '@/components/product/ProductImageGallery'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatRupiah, formatDate } from '@/lib/utils/format'
import { ShieldCheck, Gavel, Store } from 'lucide-react'
import type { Metadata } from 'next'
import type { ProductDetail } from '@/lib/types'

export const dynamic = 'force-dynamic'

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('products')
    .select('title, description')
    .eq('id', id)
    .single()

  return {
    title: data?.title ? `${data.title} — Cukain Aja` : 'Produk — Cukain Aja',
    description: data?.description?.slice(0, 160),
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params
  const adminClient = createAdminClient()

  const { data: product, error } = await adminClient
    .from('products')
    .select(`
      *,
      product_images(*),
      profiles(id, name),
      auctions(*),
      verifications(status, notes)
    `)
    .eq('id', id)
    .in('status', ['approved', 'sold'])
    .single()

  if (error || !product) notFound()

  const typedProduct = product as unknown as ProductDetail
  const isAuction = typedProduct.type === 'auction'
  const auction = typedProduct.auctions

  // Ambil sesi user untuk tombol beli/bid
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Left: Images */}
        <ProductImageGallery images={typedProduct.product_images} title={typedProduct.title} />

        {/* Right: Info */}
        <div className="space-y-6">
          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            {typedProduct.is_verified_beacukai && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200
                rounded-full text-xs font-semibold text-green-700">
                <ShieldCheck size={13} />
                Verified Bea Cukai
              </span>
            )}
            {isAuction && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0B1D3A]/5 border border-[#0B1D3A]/10
                rounded-full text-xs font-semibold text-[#0B1D3A]">
                <Gavel size={13} />
                Lelang
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-[#0B1D3A] leading-snug">{typedProduct.title}</h1>

          {/* Price / Auction info */}
          <div className="p-4 bg-slate-50 rounded-2xl space-y-1">
            {isAuction && auction ? (
              <>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Harga Saat Ini</p>
                <p className="text-3xl font-bold text-[#0B1D3A]">
                  {formatRupiah(auction.current_price ?? auction.start_price)}
                </p>
                <div className="flex gap-4 text-xs text-slate-500 pt-1">
                  <span>Mulai: {formatDate(auction.start_time)}</span>
                  <span>Selesai: {formatDate(auction.end_time)}</span>
                </div>
                <div className="pt-2">
                  <StatusBadge status={auction.status!} />
                </div>
              </>
            ) : (
              <>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Harga</p>
                <p className="text-3xl font-bold text-[#0B1D3A]">{formatRupiah(typedProduct.price)}</p>
              </>
            )}
          </div>

          {/* CTA */}
          {user ? (
            isAuction && auction?.status === 'active' ? (
              <Link
                href={`/auctions/${auction.id}`}
                className="block w-full py-4 bg-[#C8960C] text-white rounded-2xl font-bold text-center
                  hover:bg-[#C8960C]/90 transition-colors"
              >
                Ikut Lelang Sekarang
              </Link>
            ) : !isAuction ? (
              <Link
                href={`/user/checkout?product=${typedProduct.id}`}
                className="block w-full py-4 bg-[#0B1D3A] text-white rounded-2xl font-bold text-center
                  hover:bg-[#0B1D3A]/90 transition-colors"
              >
                Beli Sekarang
              </Link>
            ) : null
          ) : (
            <Link
              href="/login"
              className="block w-full py-4 bg-[#0B1D3A] text-white rounded-2xl font-bold text-center
                hover:bg-[#0B1D3A]/90 transition-colors"
            >
              Login untuk Membeli
            </Link>
          )}

          {/* Description */}
          <div>
            <h2 className="text-sm font-semibold text-slate-700 mb-2">Deskripsi</h2>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {typedProduct.description}
            </p>
          </div>

          {/* Seller */}
          <div className="flex items-center gap-3 p-4 border border-slate-100 rounded-2xl">
            <div className="w-10 h-10 bg-[#0B1D3A] rounded-full flex items-center justify-center">
              <Store size={18} className="text-[#C8960C]" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Penjual</p>
              <p className="text-sm font-semibold text-[#0B1D3A]">
                {typedProduct.profiles?.name ?? 'Seller'}
              </p>
            </div>
          </div>

          {/* Listed date */}
          <p className="text-xs text-slate-400">
            Diposting: {formatDate(typedProduct.created_at)}
          </p>
        </div>
      </div>
    </div>
  )
}