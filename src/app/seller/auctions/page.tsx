/**
 * app/(seller)/auctions/page.tsx — RSC
 */
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { AuctionTimer } from '@/components/auction/AuctionTimer'
import { formatRupiah, formatDateTime } from '@/lib/utils/format'
import { Gavel, Plus, Package } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Lelang Saya — Cukain Aja' }

export default async function SellerAuctionsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: auctions } = await supabase
        .from('auctions')
        .select(`
      *,
      products!inner(id, title, seller_id, product_images(image_url, is_primary))
    `)
        .eq('products.seller_id', user.id)
        .order('created_at', { ascending: false })

    // Produk approved + auction type yang belum punya lelang
    const { data: availableProducts } = await supabase
        .from('products')
        .select('id, title')
        .eq('seller_id', user.id)
        .eq('status', 'approved')
        .eq('type', 'auction')
        .not('id', 'in', `(${(auctions ?? []).map(a => a.product_id).join(',') || 'null'})`)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-[#0B1D3A]">Lelang Saya</h1>
                {availableProducts && availableProducts.length > 0 && (
                    <Link href="/seller/auctions/new"
                        className="flex items-center gap-2 px-4 py-2.5 bg-[#C8960C] text-[#0B1D3A]
              rounded-xl text-sm font-bold hover:bg-[#C8960C]/90 transition-colors">
                        <Plus size={16} />Buat Lelang
                    </Link>
                )}
            </div>

            {!auctions || auctions.length === 0 ? (
                <div className="bg-white border border-slate-100 rounded-2xl">
                    <EmptyState
                        icon={<Gavel size={28} />}
                        title="Belum ada lelang"
                        description="Buat lelang untuk produk bertipe 'Lelang' yang sudah diapprove admin."
                        action={
                            availableProducts && availableProducts.length > 0
                                ? <Link href="/seller/auctions/new"
                                    className="px-5 py-2.5 bg-[#C8960C] text-[#0B1D3A] rounded-xl
                      text-sm font-bold hover:bg-[#C8960C]/90 transition-colors">
                                    Buat Lelang Pertama
                                </Link>
                                : <p className="text-xs text-slate-400 max-w-xs text-center">
                                    Kamu perlu produk bertipe &quot;Lelang&quot; yang sudah disetujui admin terlebih dahulu.
                                </p>
                        }
                    />
                </div>
            ) : (
                <div className="space-y-3">
                    {auctions.map((auction) => {
                        const product = auction.products as {
                            id: string; title: string;
                            product_images: { image_url: string | null; is_primary: boolean }[]
                        } | null
                        const image = product?.product_images.find(i => i.is_primary) ?? product?.product_images[0]

                        return (
                            <div key={auction.id}
                                className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
                                <div className="flex items-center gap-4 p-5">
                                    {/* Thumbnail */}
                                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-50 shrink-0">
                                        {image?.image_url
                                            ? <img src={image.image_url} alt="" className="w-full h-full object-cover" />
                                            : <div className="w-full h-full flex items-center justify-center">
                                                <Package className="text-slate-200" size={18} />
                                            </div>
                                        }
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-[#0B1D3A] text-sm truncate">{product?.title}</p>
                                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                            <StatusBadge status={auction.status!} size="sm" />
                                            <span className="text-xs text-slate-400">
                                                Mulai {formatRupiah(auction.start_price)}
                                            </span>
                                        </div>
                                        <div className="mt-2">
                                            {auction.status === 'active' && (
                                                <AuctionTimer endTime={auction.end_time} variant="compact" />
                                            )}
                                            {auction.status === 'upcoming' && (
                                                <p className="text-xs text-slate-400">
                                                    Mulai: {formatDateTime(auction.start_time)}
                                                </p>
                                            )}
                                            {auction.status === 'ended' && (
                                                <p className="text-xs text-slate-400">
                                                    Harga akhir: {formatRupiah(auction.current_price ?? auction.start_price)}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="shrink-0">
                                        <Link href={`/auctions/${auction.id}`}
                                            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs
                        font-medium text-slate-600 hover:border-slate-300 transition-colors">
                                            Lihat Detail
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}