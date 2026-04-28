'use client'
/**
 * components/payment/PaymentStatusBanner.tsx
 *
 * Banner yang muncul di order detail setelah redirect dari Midtrans.
 * Midtrans memberikan query param ?payment=finish|error|pending
 * setelah user selesai di Snap.
 *
 * Komponen ini juga trigger verifyPayment() untuk sinkronisasi
 * status dari Midtrans Core API ke DB kita.
 */
import { useEffect, useState } from 'react'
import { CheckCircle, AlertTriangle, Clock, X, Loader2 } from 'lucide-react'
import { verifyPayment } from '@/lib/actions/payments'
import { cn } from '@/lib/utils'

interface PaymentStatusBannerProps {
    status: string
    orderId: string
}

type BannerState = {
    icon: React.ReactNode
    title: string
    description: string
    bgClass: string
    borderClass: string
    textClass: string
}

const STATUS_CONFIG: Record<string, BannerState> = {
    finish: {
        icon: <CheckCircle size={20} />,
        title: 'Pembayaran Berhasil!',
        description: 'Pesanan kamu sedang diproses. Terima kasih sudah berbelanja di Cukain Aja.',
        bgClass: 'bg-green-50',
        borderClass: 'border-green-200',
        textClass: 'text-green-700',
    },
    pending: {
        icon: <Clock size={20} />,
        title: 'Pembayaran Menunggu Konfirmasi',
        description: 'Selesaikan pembayaran sebelum batas waktu. Kami akan update status otomatis.',
        bgClass: 'bg-amber-50',
        borderClass: 'border-amber-200',
        textClass: 'text-amber-700',
    },
    error: {
        icon: <AlertTriangle size={20} />,
        title: 'Pembayaran Gagal',
        description: 'Terjadi masalah saat pembayaran. Silakan coba lagi dengan metode lain.',
        bgClass: 'bg-red-50',
        borderClass: 'border-red-200',
        textClass: 'text-red-700',
    },
}

export function PaymentStatusBanner({ status, orderId }: PaymentStatusBannerProps) {
    const [isVisible, setIsVisible] = useState(true)
    const [isVerifying, setIsVerifying] = useState(status === 'finish')
    const [verifiedStatus, setVerifiedStatus] = useState<string | null>(null)

    // Sinkronisasi status dari Midtrans
    useEffect(() => {
        if (status !== 'finish') return

        const verify = async () => {
            setIsVerifying(true)
            const result = await verifyPayment(orderId)
            setIsVerifying(false)

            if (result.data) {
                setVerifiedStatus(result.data.status)
            }
        }

        verify()
    }, [status, orderId])

    if (!isVisible) return null

    const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.error

    // Override ke verified status kalau sudah dikonfirmasi
    const displayConfig =
        verifiedStatus === 'canceled' ? STATUS_CONFIG.error
            : verifiedStatus === 'pending' ? STATUS_CONFIG.pending
                : config

    return (
        <div
            className={cn(
                'flex items-start gap-3 p-4 border rounded-2xl animate-fade-in',
                displayConfig.bgClass,
                displayConfig.borderClass
            )}
        >
            <span className={cn('shrink-0 mt-0.5', displayConfig.textClass)}>
                {isVerifying
                    ? <Loader2 size={20} className="animate-spin" />
                    : displayConfig.icon
                }
            </span>

            <div className="flex-1 min-w-0">
                <p className={cn('font-semibold text-sm', displayConfig.textClass)}>
                    {isVerifying ? 'Memverifikasi pembayaran...' : displayConfig.title}
                </p>
                {!isVerifying && (
                    <p className={cn('text-xs mt-0.5 leading-relaxed', displayConfig.textClass, 'opacity-80')}>
                        {displayConfig.description}
                    </p>
                )}
            </div>

            <button
                onClick={() => setIsVisible(false)}
                className={cn(
                    'shrink-0 p-1 rounded-lg hover:opacity-70 transition-opacity',
                    displayConfig.textClass
                )}
            >
                <X size={16} />
            </button>
        </div>
    )
}