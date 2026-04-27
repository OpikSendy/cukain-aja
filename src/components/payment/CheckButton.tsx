'use client'
/**
 * components/payment/CheckoutButton.tsx
 *
 * Tombol checkout yang integrate Midtrans Snap.
 * Snap adalah popup payment — user tidak perlu redirect ke halaman lain.
 *
 * Flow:
 * 1. User klik "Bayar Sekarang"
 * 2. Request snap token dari server action
 * 3. Buka Midtrans Snap popup
 * 4. User bayar di popup
 * 5. Midtrans callback → verifyPayment
 * 6. Redirect ke order detail dengan status
 */
import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, CreditCard, ExternalLink } from 'lucide-react'
import { initiatePayment, verifyPayment } from '@/lib/actions/payments'
import { notify } from '@/components/ui/Toaster'
import { cn } from '@/lib/utils'
import { MIDTRANS_CONFIG } from '@/constants/config'

interface CheckoutButtonProps {
    orderId: string
    amount: number
    /** Tampilkan sebagai link redirect (fallback) atau popup */
    variant?: 'snap' | 'redirect'
    className?: string
}

// Extend window type untuk Midtrans Snap SDK
declare global {
    interface Window {
        snap?: {
            pay: (
                token: string,
                options: {
                    onSuccess?: (result: unknown) => void
                    onPending?: (result: unknown) => void
                    onError?: (result: unknown) => void
                    onClose?: () => void
                    language?: string
                }
            ) => void
        }
    }
}

export function CheckoutButton({
    orderId,
    amount,
    variant = 'snap',
    className,
}: CheckoutButtonProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [snapLoaded, setSnapLoaded] = useState(false)
    const [isSnapOpen, setIsSnapOpen] = useState(false)

    // Load Midtrans Snap.js SDK
    useEffect(() => {
        const existing = document.querySelector('[data-midtrans-snap]')
        if (existing) { setSnapLoaded(true); return }

        const script = document.createElement('script')
        script.src = MIDTRANS_CONFIG.snapUrl
        script.setAttribute('data-client-key', MIDTRANS_CONFIG.clientKey)
        script.setAttribute('data-midtrans-snap', 'true')
        script.async = true
        script.onload = () => setSnapLoaded(true)
        script.onerror = () => console.error('[snap] Failed to load Midtrans Snap.js')
        document.head.appendChild(script)
    }, [])

    const handlePay = () => {
        startTransition(async () => {
            // 1. Dapatkan snap token dari server
            const result = await initiatePayment(orderId)

            if (result.error || !result.data) {
                notify.error('Gagal memulai pembayaran', result.error ?? undefined)
                return
            }

            const { snapToken, snapUrl } = result.data

            // 2. Fallback: kalau Snap SDK tidak loaded, buka redirect URL
            if (!snapLoaded || !window.snap || variant === 'redirect') {
                window.open(snapUrl, '_blank')
                return
            }

            // 3. Buka Snap popup
            setIsSnapOpen(true)
            window.snap.pay(snapToken, {
                language: 'id',

                onSuccess: async (result) => {
                    setIsSnapOpen(false)
                    console.info('[snap] Payment success:', result)
                    notify.loading('Memverifikasi pembayaran...')

                    const verifyResult = await verifyPayment(orderId)
                    notify.dismiss()

                    if (verifyResult.data?.status === 'paid') {
                        notify.success('Pembayaran berhasil! 🎉', 'Pesanan kamu sedang diproses.')
                    } else {
                        notify.info('Pembayaran sedang diproses', 'Kami akan update status segera.')
                    }

                    router.push(`/user/orders/${orderId}?payment=finish`)
                    router.refresh()
                },

                onPending: async (result) => {
                    setIsSnapOpen(false)
                    console.info('[snap] Payment pending:', result)
                    notify.info(
                        'Pembayaran sedang menunggu',
                        'Selesaikan pembayaran sebelum batas waktu.'
                    )
                    router.push(`/user/orders/${orderId}?payment=pending`)
                    router.refresh()
                },

                onError: (result) => {
                    setIsSnapOpen(false)
                    console.error('[snap] Payment error:', result)
                    notify.error('Pembayaran gagal', 'Silakan coba lagi atau gunakan metode lain.')
                },

                onClose: () => {
                    setIsSnapOpen(false)
                    // User menutup popup tanpa menyelesaikan
                    notify.info('Pembayaran belum selesai', 'Kamu bisa melanjutkan pembayaran kapan saja.')
                },
            })
        })
    }

    const isLoading = isPending || isSnapOpen

    return (
        <button
            onClick={handlePay}
            disabled={isLoading}
            className={cn(
                'flex items-center justify-center gap-2 font-bold text-sm rounded-2xl',
                'transition-all active:scale-[0.98]',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                isLoading
                    ? 'bg-slate-100 text-slate-400'
                    : 'bg-[#C8960C] text-[#0B1D3A] hover:bg-[#C8960C]/90 shadow-md shadow-[#C8960C]/20',
                className ?? 'w-full py-4'
            )}
        >
            {isLoading ? (
                <>
                    <Loader2 size={18} className="animate-spin" />
                    {isSnapOpen ? 'Menunggu pembayaran...' : 'Memproses...'}
                </>
            ) : (
                <>
                    {variant === 'redirect'
                        ? <ExternalLink size={18} />
                        : <CreditCard size={18} />
                    }
                    Bayar Sekarang
                </>
            )}
        </button>
    )
}