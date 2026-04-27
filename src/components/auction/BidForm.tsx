'use client'
/**
 * components/auction/BidForm.tsx
 *
 * Form bidding dengan UX yang dipikirkan matang:
 * - Tampilkan harga saat ini secara realtime
 * - Preset bid increments untuk kemudahan
 * - Konfirmasi sebelum submit
 * - Feedback jelas: menang/tertandingi/dikunci
 */
import { useState, useTransition, useCallback } from 'react'
import { Loader2, TrendingUp, Gavel, Lock, AlertCircle } from 'lucide-react'
import { placeBid } from '@/lib/actions/auctions'
import { formatRupiah } from '@/lib/utils/format'
import { notify } from '@/components/ui/Toaster'
import { cn } from '@/lib/utils'
import { AUCTION_CONFIG } from '@/constants/config'

interface BidFormProps {
    auctionId: string
    currentPrice: number
    isActive: boolean
    isAuthenticated: boolean
    /** Apakah user ini pemilik produk — tidak boleh bid */
    isOwner?: boolean
    /** Callback setelah bid berhasil */
    onBidSuccess?: (newPrice: number) => void
}

// Increment presets yang wajar
function getBidIncrements(currentPrice: number): number[] {
    if (currentPrice < 500_000) return [10_000, 25_000, 50_000]
    if (currentPrice < 2_000_000) return [50_000, 100_000, 250_000]
    if (currentPrice < 10_000_000) return [250_000, 500_000, 1_000_000]
    if (currentPrice < 50_000_000) return [1_000_000, 2_500_000, 5_000_000]
    return [5_000_000, 10_000_000, 25_000_000]
}

export function BidForm({
    auctionId,
    currentPrice,
    isActive,
    isAuthenticated,
    isOwner = false,
    onBidSuccess,
}: BidFormProps) {
    const [isPending, startTransition] = useTransition()
    const [bidAmount, setBidAmount] = useState('')
    const [showConfirm, setShowConfirm] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const increments = getBidIncrements(currentPrice)
    const minBid = currentPrice + AUCTION_CONFIG.minBidIncrement
    const parsedBid = parseFloat(bidAmount.replace(/\D/g, ''))
    const isValidBid = !isNaN(parsedBid) && parsedBid >= minBid

    const handlePreset = (increment: number) => {
        setBidAmount((currentPrice + increment).toString())
        setError(null)
    }

    const handleSubmit = useCallback(() => {
        if (!isValidBid) {
            setError(`Bid minimal ${formatRupiah(minBid)}`)
            return
        }

        if (!showConfirm) {
            setShowConfirm(true)
            return
        }

        setShowConfirm(false)
        setError(null)

        startTransition(async () => {
            const result = await placeBid(auctionId, parsedBid)

            if (result.error) {
                setError(result.error)
                notify.error('Bid gagal', result.error)
                return
            }

            setBidAmount('')
            notify.success(`Bid ${formatRupiah(parsedBid)} berhasil dipasang! 🎉`)
            onBidSuccess?.(parsedBid)
        })
    }, [auctionId, parsedBid, isValidBid, showConfirm, minBid, onBidSuccess])

    // ─── Locked states ───────────────────────────────────────────────────────────

    if (!isAuthenticated) {
        return (
            <div className="p-5 bg-[#0B1D3A]/3 border border-[#0B1D3A]/10 rounded-2xl text-center space-y-3">
                <Lock className="mx-auto text-slate-400" size={24} />
                <div>
                    <p className="font-semibold text-[#0B1D3A] text-sm">Login untuk Ikut Lelang</p>
                    <p className="text-slate-500 text-xs mt-1">
                        Buat akun atau masuk untuk memasang bid
                    </p>
                </div>
                <div className="flex gap-2">
                    <a href="/login" className="flex-1 py-2.5 border border-slate-200 text-slate-600
            rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors text-center">
                        Masuk
                    </a>
                    <a href="/register" className="flex-1 py-2.5 bg-[#0B1D3A] text-white
            rounded-xl text-sm font-semibold hover:bg-[#0B1D3A]/90 transition-colors text-center">
                        Daftar
                    </a>
                </div>
            </div>
        )
    }

    if (isOwner) {
        return (
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-center">
                <p className="text-sm text-slate-500">Kamu adalah pemilik produk ini.</p>
            </div>
        )
    }

    if (!isActive) {
        return (
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-center">
                <p className="text-sm font-medium text-slate-600">Lelang tidak sedang aktif</p>
                <p className="text-xs text-slate-400 mt-1">
                    Lelang sudah berakhir atau belum dimulai
                </p>
            </div>
        )
    }

    // ─── Active bid form ─────────────────────────────────────────────────────────

    return (
        <div className="space-y-4">
            {/* Preset increments */}
            <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                    Tambah Bid Cepat
                </p>
                <div className="flex gap-2">
                    {increments.map((inc) => (
                        <button
                            key={inc}
                            type="button"
                            onClick={() => handlePreset(inc)}
                            disabled={isPending}
                            className="flex-1 py-2 border border-slate-200 rounded-xl text-xs font-semibold
                text-slate-600 hover:border-[#0B1D3A] hover:text-[#0B1D3A] hover:bg-[#0B1D3A]/3
                transition-all disabled:opacity-50"
                        >
                            +{formatRupiah(inc)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Custom amount input */}
            <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                    Atau Masukkan Nominal
                </p>
                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500
            text-sm font-semibold">
                        Rp
                    </span>
                    <input
                        type="number"
                        value={bidAmount}
                        onChange={(e) => {
                            setBidAmount(e.target.value)
                            setError(null)
                            setShowConfirm(false)
                        }}
                        placeholder={minBid.toString()}
                        min={minBid}
                        disabled={isPending}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-[#0B1D3A]
              font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1D3A]
              focus:border-transparent disabled:opacity-50 transition-shadow"
                    />
                </div>

                {/* Preview parsed amount */}
                {parsedBid > 0 && (
                    <p className={cn(
                        'text-xs mt-1.5 font-medium',
                        isValidBid ? 'text-green-600' : 'text-red-500'
                    )}>
                        {isValidBid
                            ? `✓ Bid: ${formatRupiah(parsedBid)}`
                            : `Minimal bid: ${formatRupiah(minBid)}`
                        }
                    </p>
                )}
            </div>

            {/* Error */}
            {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
                    <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                    <p className="text-red-600 text-xs">{error}</p>
                </div>
            )}

            {/* Confirm state */}
            {showConfirm && isValidBid && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                    <p className="text-sm font-semibold text-amber-800">Konfirmasi Bid</p>
                    <p className="text-xs text-amber-700">
                        Kamu akan memasang bid sebesar{' '}
                        <strong>{formatRupiah(parsedBid)}</strong>.
                        Bid tidak bisa dibatalkan setelah dikonfirmasi.
                    </p>
                    <div className="flex gap-2 pt-1">
                        <button
                            type="button"
                            onClick={() => setShowConfirm(false)}
                            className="flex-1 py-2 border border-amber-200 text-amber-700 rounded-xl
                text-xs font-semibold hover:bg-amber-100 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isPending}
                            className="flex-1 py-2 bg-amber-500 text-white rounded-xl text-xs
                font-bold hover:bg-amber-600 transition-colors disabled:opacity-50
                flex items-center justify-center gap-1.5"
                        >
                            {isPending
                                ? <><Loader2 size={13} className="animate-spin" /> Memproses...</>
                                : '✓ Ya, Pasang Bid'
                            }
                        </button>
                    </div>
                </div>
            )}

            {/* Submit button */}
            {!showConfirm && (
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!isValidBid || isPending}
                    className={cn(
                        'w-full py-4 rounded-2xl font-bold text-sm transition-all',
                        'flex items-center justify-center gap-2',
                        'active:scale-[0.98]',
                        isValidBid && !isPending
                            ? 'bg-[#C8960C] text-[#0B1D3A] hover:bg-[#C8960C]/90 shadow-md shadow-[#C8960C]/20'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    )}
                >
                    {isPending ? (
                        <><Loader2 size={16} className="animate-spin" /> Memproses Bid...</>
                    ) : (
                        <><Gavel size={16} /> Pasang Bid</>
                    )}
                </button>
            )}

            <p className="text-center text-[10px] text-slate-400">
                Dengan memasang bid, kamu setuju dengan{' '}
                <a href="/terms" className="underline hover:text-slate-600">Syarat Lelang</a>{' '}
                Cukain Aja.
            </p>
        </div>
    )
}