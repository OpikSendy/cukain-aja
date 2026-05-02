/**
 * app/(public)/auctions/[id]/page.tsx — Auction Detail (RSC + Client hybrid)
 *
 * Ini adalah halaman paling penting dari sisi UX:
 * - Realtime price update
 * - Live countdown
 * - Realtime bid history
 * - Bid form dengan UX feedback lengkap
 */
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { AuctionRealtime } from '@/components/auction/AuctionRealtime'
import { ProductImageGallery } from '@/components/product/ProductImageGallery'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatDate } from '@/lib/utils/format'
import { ShieldCheck, Store, Calendar } from 'lucide-react'
import type { Metadata } from 'next'
import type { BidWithBidder, ProductImage } from '@/lib/types'

export const dynamic = 'force-dynamic'

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params
    const supabase = createAdminClient()
    const { data } = await supabase
        .from('auctions')
        .select('products(title)')
        .eq('id', id)
        .single()

    const product = data?.products as { title: string } | null
    return { title: product?.title ? `Lelang: ${product.title} — Cukain Aja` : 'Detail Lelang' }
}

export default async function AuctionDetailPage({ params }: Props) {
    const { id } = await params
    const adminClient = createAdminClient()

    // Fetch auction dengan semua relasi
    const { data: auction, error } = await adminClient
        .from('auctions')
        .select(`
      *,
      products(
        id, title, description, seller_id, is_verified_beacukai, created_at,
        product_images(*),
        profiles(id, name)
      )
    `)
        .eq('id', id)
        .single()

    if (error || !auction) notFound()

    // Fetch initial bids (50 terbaru)
    const { data: initialBids } = await adminClient
        .from('bids')
        .select('*, profiles(id, name)')
        .eq('auction_id', id)
        .order('amount', { ascending: false })
        .limit(50)

    // Cek auth user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const product = auction.products as {
        id: string;
        title: string;
        description: string;
        seller_id: string;
        is_verified_beacukai: boolean;
        created_at: string;
        product_images: ProductImage[];
        profiles: { id: string; name: string } | null;
    } | null

    if (!product) notFound()

    const isOwner = user?.id === product.seller_id

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr,380px] gap-8 items-start">

                {/* ─── Left: Gambar + Info Produk ─── */}
                <div className="space-y-6">
                    {/* Image gallery */}
                    <ProductImageGallery
                        images={product.product_images}
                        title={product.title}
                    />

                    {/* Product info */}
                    <div className="bg-white border border-slate-100 rounded-2xl p-6 space-y-4">
                        {/* Badges */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <StatusBadge status={auction.status!} />
                            {product.is_verified_beacukai && (
                                <span className="flex items-center gap-1.5 px-3 py-1 bg-green-50
                  border border-green-200 rounded-full text-xs font-semibold text-green-700">
                                    <ShieldCheck size={12} />
                                    Verified Bea Cukai
                                </span>
                            )}
                        </div>

                        <h1 className="text-2xl font-bold text-[#0B1D3A] leading-snug">
                            {product.title}
                        </h1>

                        {/* Seller */}
                        <div className="flex items-center gap-2 py-3 border-y border-slate-50">
                            <div className="w-8 h-8 bg-[#0B1D3A] rounded-full flex items-center justify-center">
                                <Store size={15} className="text-[#C8960C]" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400">Dijual oleh</p>
                                <p className="text-sm font-semibold text-[#0B1D3A]">
                                    {product.profiles?.name ?? 'Seller'}
                                </p>
                            </div>
                            <div className="ml-auto flex items-center gap-1.5 text-xs text-slate-400">
                                <Calendar size={12} />
                                {formatDate(product.created_at)}
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <p className="text-sm font-semibold text-slate-700 mb-2">Deskripsi</p>
                            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                                {product.description}
                            </p>
                        </div>
                    </div>
                </div>

                {/* ─── Right: Realtime Auction Panel ─── */}
                {/* AuctionRealtime adalah client component yang handle semua realtime logic */}
                <div className="lg:sticky lg:top-20">
                    <AuctionRealtime
                        auctionId={id}
                        initialAuction={auction as never}
                        initialBids={(initialBids ?? []) as BidWithBidder[]}
                        currentUserId={user?.id}
                        isOwner={isOwner}
                        isAuthenticated={!!user}
                    />
                </div>
            </div>
        </div>
    )
}