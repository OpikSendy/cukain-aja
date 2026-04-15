/**
 * app/(seller)/products/page.tsx — Seller Product List (RSC)
 */
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/shared/ProductCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Plus, Package } from 'lucide-react'
import type { Metadata } from 'next'
import type { ProductWithImages } from '@/lib/types'

export const metadata: Metadata = { title: 'Produk Saya — Cukain Aja' }

export default async function SellerProductsPage({
  searchParams,
}: {
  searchParams: { submitted?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: products } = await supabase
    .from('products')
    .select('*, product_images(*), profiles(id, name)')
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false })

  const typedProducts = (products ?? []) as ProductWithImages[]

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1D3A]">Produk Saya</h1>
          <p className="text-slate-500 text-sm mt-1">{typedProducts.length} produk</p>
        </div>
        <Link
          href="/seller/products/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-[#0B1D3A] text-white
            rounded-xl text-sm font-semibold hover:bg-[#0B1D3A]/90 transition-colors"
        >
          <Plus size={16} />
          Tambah Produk
        </Link>
      </div>

      {/* Success notification */}
      {searchParams.submitted && (
        <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-xl">
          <p className="text-green-700 text-sm font-medium">
            ✓ Produk berhasil disubmit. Admin akan mereview dalam 1-2 hari kerja.
          </p>
        </div>
      )}

      {/* Products */}
      {typedProducts.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto">
            <Package className="text-slate-300" size={32} />
          </div>
          <p className="font-medium text-slate-700">Belum ada produk</p>
          <p className="text-slate-400 text-sm">Mulai jual barang bea cukai pertama kamu</p>
          <Link
            href="/seller/products/new"
            className="inline-flex items-center gap-2 mt-2 px-5 py-2.5 bg-[#0B1D3A]
              text-white rounded-xl text-sm font-semibold hover:bg-[#0B1D3A]/90 transition-colors"
          >
            <Plus size={16} />
            Tambah Produk
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {typedProducts.map((product) => (
            <div
              key={product.id}
              className="flex items-center gap-4 p-4 bg-white border border-slate-100
                rounded-2xl hover:border-slate-200 transition-all group"
            >
              {/* Thumbnail */}
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-50 shrink-0">
                {product.product_images.find(i => i.is_primary)?.image_url ? (
                  <img
                    src={product.product_images.find(i => i.is_primary)!.image_url!}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="text-slate-300" size={20} />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#0B1D3A] text-sm truncate">{product.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <StatusBadge status={product.status!} size="sm" />
                  <span className="text-xs text-slate-400 capitalize">{product.type}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 shrink-0">
                {['draft', 'rejected'].includes(product.status!) && (
                  <Link
                    href={`/seller/products/${product.id}/edit`}
                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs
                      font-medium text-slate-600 hover:border-slate-300 transition-colors"
                  >
                    Edit
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}