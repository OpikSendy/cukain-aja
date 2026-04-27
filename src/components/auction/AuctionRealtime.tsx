'use client'
/**
 * components/auction/AuctionRealtime.tsx
 *
 * Panel lelang utama — semua realtime logic ada di sini.
 * Ini adalah jantung UX auction Cukain Aja.
 *
 * Features:
 * - Harga update realtime tanpa refresh
 * - Bid history update realtime
 * - Countdown timer live
 * - Bid form terintegrasi
 * - Animasi harga naik saat ada bid baru
 * - Toast notification untuk bid orang lain
 */
import { useState, useEffect, useRef } from 'react'
import { BidForm } from '@/components/auction/BidForm'
import { BidHistory } from '@/components/auction/BidHistory'
import { AuctionTimer } from '@/components/auction/AuctionTimer'
import { formatRupiah } from '@/lib/utils/format'
import { notify } from '@/components/ui/Toaster'
import { createClient } from '@/lib/supabase/client'
import { TrendingUp, Users, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Auction, BidWithBidder } from '@/lib/types'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface AuctionRealtimeProps {
    auctionId: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initialAuction: any
    initialBids: BidWithBidder[]
    currentUserId?: string
    isOwner: boolean
    isAuthenticated: boolean
}

export function AuctionRealtime({
    auctionId,
    initialAuction,
    initialBids,
    currentUserId,
    isOwner,
    isAuthenticated,
}: AuctionRealtimeProps) {
    const [auction, setAuction] = useState(initialAuction)
    const [bids, setBids] = useState<BidWithBidder[]>(initialBids)
    const [isConnected, setIsConnected] = useState(false)
    const [priceFlash, setPriceFlash] = useState(false)
    const [showAllBids, setShowAllBids] = useState(false)
    const prevPrice = useRef(initialAuction.current_price)
    const supabase = createClient()

    // ─── Realtime subscription ───────────────────────────────────────────────────
    useEffect(() => {
        const channel: RealtimeChannel = supabase
            .channel(`auction-panel:${auctionId}`)
            // Auction price/status update
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'auctions',
                filter: `id=eq.${auctionId}`,
            }, (payload) => {
                const updated = payload.new as Auction

                // Flash animation saat harga naik
                if (updated.current_price !== prevPrice.current) {
                    setPriceFlash(true)
                    setTimeout(() => setPriceFlash(false), 1000)
                    prevPrice.current = updated.current_price
                }

                setAuction((prev: typeof initialAuction) => ({ ...prev, ...updated }))
            })
            // New bid
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'bids',
                filter: `auction_id=eq.${auctionId}`,
            }, async (payload) => {
                const newBid = payload.new as { id: string; user_id: string; amount: number }

                // Fetch bidder name
                const { data: bidWithBidder } = await supabase
                    .from('bids')
                    .select('*, profiles(id, name)')
                    .eq('id', newBid.id)
                    .single()

                if (bidWithBidder) {
                    setBids((prev) => [bidWithBidder as BidWithBidder, ...prev].slice(0, 50))
                }

                // Notify kalau bukan bid sendiri
                if (newBid.user_id !== currentUserId) {
                    notify.info(
                        'Ada bid baru!',
                        `Penawaran ${formatRupiah(newBid.amount)}`
                    )
                }
            })
            .subscribe((status) => {
                setIsConnected(status === 'SUBSCRIBED')
            })

        return () => {
            supabase.removeChannel(channel)
        }
    }, [auctionId, currentUserId]) // eslint-disable-line react-hooks/exhaustive-deps

    const displayedBids = showAllBids ? bids : bids.slice(0, 5)

    return (
        <div className="space-y-4">
            {/* ─ Price Panel ─ */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4">
                {/* Connection indicator */}
                <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Lelang Realtime
                    </p>
                    <div className="flex items-center gap-1.5">
                        <div className={cn(
                            'w-1.5 h-1.5 rounded-full',
                            isConnected ? 'bg-green-500 animate-pulse' : 'bg-slate-300'
                        )} />
                        <span className="text-[10px] font-medium text-slate-400">
                            {isConnected ? 'Terhubung' : 'Menghubungkan...'}
                        </span>
                    </div>
                </div>

                {/* Current price — with flash animation */}
                <div className={cn(
                    'transition-all duration-300 rounded-xl p-4',
                    priceFlash ? 'bg-[#C8960C]/10 scale-[1.02]' : 'bg-slate-50'
                )}>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">
                        {auction.status === 'active' ? 'Penawaran Tertinggi' : 'Harga Awal'}
                    </p>
                    <p className={cn(
                        'text-3xl font-black text-[#0B1D3A] tracking-tight transition-colors duration-300',
                        priceFlash && 'text-[#C8960C]'
                    )}>
                        {formatRupiah(auction.current_price ?? auction.start_price)}
                    </p>
                    {priceFlash && (
                        <div className="flex items-center gap-1 mt-1">
                            <TrendingUp size={12} className="text-[#C8960C]" />
                            <span className="text-xs font-semibold text-[#C8960C]">Harga baru!</span>
                        </div>
                    )}
                </div>

                {/* Auction info */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-slate-50 rounded-xl p-3">
                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Total Bid</p>
                        <div className="flex items-center gap-1.5 mt-1">
                            <Users size={14} className="text-slate-500" />
                            <p className="font-bold text-[#0B1D3A]">{bids.length}</p>
                        </div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3">
                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">
                            Harga Awal
                        </p>
                        <p className="font-bold text-[#0B1D3A] mt-1 text-sm">
                            {formatRupiah(auction.start_price)}
                        </p>
                    </div>
                </div>

                {/* Countdown */}
                {auction.status === 'active' && (
                    <AuctionTimer endTime={auction.end_time} variant="default" />
                )}
                {auction.status === 'upcoming' && (
                    <div className="pt-1">
                        <p className="text-xs text-slate-400 mb-1">Lelang dimulai</p>
                        <AuctionTimer endTime={auction.start_time} variant="default" />
                    </div>
                )}
                {auction.status === 'ended' && (
                    <div className="p-3 bg-slate-50 rounded-xl text-center">
                        <p className="text-sm font-semibold text-slate-600">🏁 Lelang Telah Selesai</p>
                        {bids.length > 0 && (
                            <p className="text-xs text-slate-400 mt-1">
                                Pemenang: {formatRupiah(bids[0]?.amount ?? 0)}
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* ─ Bid Form ─ */}
            {auction.status === 'active' && (
                <div className="bg-white border border-slate-100 rounded-2xl p-5">
                    <h2 className="font-semibold text-[#0B1D3A] mb-4">Pasang Bid</h2>
                    <BidForm
                        auctionId={auctionId}
                        currentPrice={auction.current_price ?? auction.start_price}
                        isActive={auction.status === 'active'}
                        isAuthenticated={isAuthenticated}
                        isOwner={isOwner}
                        onBidSuccess={(newPrice) => {
                            setAuction((prev: typeof initialAuction) => ({ ...prev, current_price: newPrice }))
                        }}
                    />
                </div>
            )}

            {/* ─ Bid History ─ */}
            <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
                    <h2 className="font-semibold text-[#0B1D3A]">
                        Riwayat Bid
                        {bids.length > 0 && (
                            <span className="ml-2 text-xs font-bold text-slate-400">({bids.length})</span>
                        )}
                    </h2>

                    {/* Live indicator */}
                    {isConnected && auction.status === 'active' && (
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-[10px] font-semibold text-green-600">Live</span>
                        </div>
                    )}
                </div>

                <div className="px-4 py-3">
                    <BidHistory bids={displayedBids} currentUserId={currentUserId} />
                </div>

                {/* Show more */}
                {bids.length > 5 && (
                    <button
                        onClick={() => setShowAllBids(!showAllBids)}
                        className="w-full flex items-center justify-center gap-1.5 py-3
              border-t border-slate-50 text-xs font-semibold text-slate-500
              hover:text-[#0B1D3A] hover:bg-slate-50 transition-colors"
                    >
                        {showAllBids ? (
                            <><ChevronUp size={14} /> Sembunyikan</>
                        ) : (
                            <><ChevronDown size={14} /> Lihat {bids.length - 5} bid lainnya</>
                        )}
                    </button>
                )}
            </div>
        </div>
    )
}