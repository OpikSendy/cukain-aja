/**
 * app/(public)/auctions/page.tsx — Auction Listing (RSC)
 */
import { createAdminClient } from '@/lib/supabase/admin'
import { AuctionTimer } from '@/components/auction/AuctionTimer'
import { ProductCardSkeleton } from '@/components/shared/Skeleton'
import { formatRupiah, formatDate } from '@/lib/utils/format'
import { Gavel, Package, Filter } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Lelang — Cukain Aja',
    description: 'Ikut lelang barang bea cukai resmi. Update realtime, transparan, terjamin.',
}

// Selalu fresh — tidak pakai cache
export const dynamic = 'force-dynamic'

export default async function AuctionsPage({
    searchParams,
}: {
    searchParams: Promise<{ status?: string }>
}) {
    const params = await searchParams
    const validStatus = ['active', 'upcoming', 'ended'] as const

    type Status = typeof validStatus[number]

    const status = (validStatus.includes(params.status as Status)
        ? params.status
        : 'active') as Status

    const supabase = createAdminClient()

    const { data: auctions } = await supabase
        .from('auctions')
        .select(`
      *,
      products(
        id, title, description, is_verified_beacukai,
        product_images(image_url, is_primary),
        profiles(name)
      )
    `)
        .eq('status', status)
        .order('end_time', { ascending: true })

    const TABS = [
        { label: '🟢 Berlangsung', value: 'active' },
        { label: '🕐 Akan Dimulai', value: 'upcoming' },
        { label: '✓ Selesai', value: 'ended' },
    ]

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
            {/* Header */}
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <Gavel className="text-[#C8960C]" size={24} />
                    <h1 className="text-3xl font-bold text-[#0B1D3A]">Lelang</h1>
                </div>
                <p className="text-slate-500">
                    Ikut bidding barang bea cukai terverifikasi secara realtime.
                </p>
            </div>

            {/* Status tabs */}
            <div className="flex gap-2 border-b border-slate-100 overflow-x-auto">
                {TABS.map((tab) => (
                    <a
                        key={tab.value}
                        href={`/auctions?status=${tab.value}`}
                        className={`px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2
              transition-all -mb-px ${status === tab.value
                                ? 'border-[#0B1D3A] text-[#0B1D3A]'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        {tab.label}
                        {tab.value === 'active' && auctions && auctions.length > 0 && (
                            <span className="ml-1.5 px-1.5 py-0.5 bg-green-100 text-green-700
                rounded-full text-[10px] font-bold">
                                {auctions.length}
                            </span>
                        )}
                    </a>
                ))}
            </div>

            {/* Auction grid */}
            <Suspense fallback={
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)}
                </div>
            }>
                {!auctions || auctions.length === 0 ? (
                    <div className="text-center py-20 border border-dashed border-slate-200 rounded-2xl">
                        <Gavel className="mx-auto text-slate-200 mb-3" size={36} />
                        <p className="text-slate-400">
                            {status === 'active' ? 'Tidak ada lelang yang berlangsung saat ini.'
                                : status === 'upcoming' ? 'Tidak ada lelang yang akan dimulai.'
                                    : 'Belum ada lelang yang selesai.'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {auctions.map((auction) => {
                            const product = auction.products as {
                                id: string; title: string; description: string;
                                is_verified_beacukai: boolean;
                                product_images: { image_url: string | null; is_primary: boolean }[];
                                profiles: { name: string } | null;
                            } | null

                            const image = product?.product_images.find(i => i.is_primary)
                                ?? product?.product_images?.[0]

                            return (
                                <Link
                                    key={auction.id}
                                    href={`/auctions/${auction.id}`}
                                    className="group bg-white border border-slate-100 rounded-2xl overflow-hidden
                    hover:border-slate-200 hover:shadow-md transition-all duration-200"
                                >
                                    {/* Image */}
                                    <div className="relative aspect-video bg-slate-50 overflow-hidden">
                                        {image?.image_url ? (
                                            <img
                                                src={image.image_url}
                                                alt={product?.title ?? ''}
                                                className="w-full h-full object-cover group-hover:scale-105
                          transition-transform duration-300"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Package className="text-slate-200" size={36} />
                                            </div>
                                        )}

                                        {/* Status badge */}
                                        <div className="absolute top-3 left-3">
                                            {auction.status === 'active' && (
                                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500
                          rounded-full shadow-sm">
                                                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                                                    <span className="text-white text-[10px] font-bold tracking-wide">
                                                        LIVE
                                                    </span>
                                                </div>
                                            )}
                                            {auction.status === 'upcoming' && (
                                                <div className="px-2.5 py-1 bg-[#0B1D3A]/80 backdrop-blur-sm
                          rounded-full shadow-sm">
                                                    <span className="text-white text-[10px] font-bold">
                                                        MULAI {formatDate(auction.start_time)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Verified badge */}
                                        {product?.is_verified_beacukai && (
                                            <div className="absolute top-3 right-3 px-2 py-1 bg-white/90
                        backdrop-blur-sm rounded-full shadow-sm">
                                                <span className="text-green-700 text-[10px] font-bold">✓ Verified</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="p-4 space-y-3">
                                        <div>
                                            <p className="font-semibold text-[#0B1D3A] text-sm line-clamp-2
                        group-hover:text-[#C8960C] transition-colors">
                                                {product?.title}
                                            </p>
                                            <p className="text-xs text-slate-400 mt-0.5">{product?.profiles?.name}</p>
                                        </div>

                                        {/* Price row */}
                                        <div className="flex items-end justify-between">
                                            <div>
                                                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">
                                                    {auction.status === 'active' ? 'Penawaran Tertinggi' : 'Harga Awal'}
                                                </p>
                                                <p className="text-lg font-black text-[#0B1D3A]">
                                                    {formatRupiah(auction.current_price ?? auction.start_price)}
                                                </p>
                                            </div>

                                            {/* Timer */}
                                            {auction.status === 'active' && (
                                                <AuctionTimer
                                                    endTime={auction.end_time}
                                                    variant="compact"
                                                />
                                            )}
                                            {auction.status === 'upcoming' && auction.start_time && (
                                                <p className="text-xs text-slate-400">
                                                    {formatDate(auction.start_time)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                )}
            </Suspense>
        </div>
    )
}