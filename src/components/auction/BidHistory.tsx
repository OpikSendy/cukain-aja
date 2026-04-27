'use client'
/**
 * components/auction/BidHistory.tsx
 *
 * Riwayat bid realtime — update otomatis saat ada bid baru.
 */
import { Trophy, TrendingUp } from 'lucide-react'
import { formatRupiah, formatRelativeTime } from '@/lib/utils/format'
import { cn } from '@/lib/utils'
import type { BidWithBidder } from '@/lib/types'

interface BidHistoryProps {
    bids: BidWithBidder[]
    currentUserId?: string
}

export function BidHistory({ bids, currentUserId }: BidHistoryProps) {
    if (bids.length === 0) {
        return (
            <div className="text-center py-8">
                <TrendingUp className="mx-auto text-slate-200 mb-2" size={28} />
                <p className="text-sm text-slate-400">Belum ada bid. Jadilah yang pertama!</p>
            </div>
        )
    }

    return (
        <div className="space-y-0 divide-y divide-slate-50">
            {bids.map((bid, index) => {
                const isLeading = index === 0
                const isCurrentUser = bid.user_id === currentUserId
                const bidder = (bid.profiles as { name: string } | null)

                return (
                    <div
                        key={bid.id}
                        className={cn(
                            'flex items-center gap-3 py-3 px-1 transition-colors',
                            isLeading && 'bg-[#C8960C]/5 rounded-xl -mx-1 px-2',
                            isCurrentUser && 'bg-[#0B1D3A]/3'
                        )}
                    >
                        {/* Rank */}
                        <div className={cn(
                            'w-7 h-7 rounded-full flex items-center justify-center shrink-0',
                            isLeading ? 'bg-[#C8960C] text-white' : 'bg-slate-100 text-slate-400'
                        )}>
                            {isLeading
                                ? <Trophy size={14} />
                                : <span className="text-[11px] font-bold">#{index + 1}</span>
                            }
                        </div>

                        {/* Bidder info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                                <p className={cn(
                                    'text-sm font-semibold truncate',
                                    isLeading ? 'text-[#C8960C]' : 'text-[#0B1D3A]'
                                )}>
                                    {/* Sembunyikan sebagian nama untuk privasi */}
                                    {maskName(bidder?.name ?? 'Anonim')}
                                </p>
                                {isCurrentUser && (
                                    <span className="text-[9px] font-bold text-[#0B1D3A] bg-[#0B1D3A]/10
                    px-1.5 py-0.5 rounded-full shrink-0">
                                        Kamu
                                    </span>
                                )}
                                {isLeading && (
                                    <span className="text-[9px] font-bold text-[#C8960C] bg-[#C8960C]/10
                    px-1.5 py-0.5 rounded-full shrink-0">
                                        Tertinggi
                                    </span>
                                )}
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                                {formatRelativeTime(bid.created_at)}
                            </p>
                        </div>

                        {/* Amount */}
                        <p className={cn(
                            'text-sm font-bold shrink-0',
                            isLeading ? 'text-[#C8960C]' : 'text-[#0B1D3A]'
                        )}>
                            {formatRupiah(bid.amount)}
                        </p>
                    </div>
                )
            })}
        </div>
    )
}

/** Sembunyikan sebagian nama: "Budi Santoso" → "Bu** San***" */
function maskName(name: string): string {
    return name
        .split(' ')
        .map((word) => {
            if (word.length <= 2) return word
            return word.slice(0, 2) + '*'.repeat(word.length - 2)
        })
        .join(' ')
}