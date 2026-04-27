'use client'
/**
 * components/auction/AuctionTimer.tsx
 *
 * Countdown timer realtime untuk halaman lelang.
 * UX states:
 *   - Normal: tampilkan jam/menit/detik
 *   - Critical (< 1 jam): warna merah + subtle pulse
 *   - Very critical (< 5 menit): lebih agresif
 *   - Expired: tampilkan "Lelang Selesai"
 */
import { useAuctionCountdown } from '@/lib/hooks/useAuction'
import { Clock, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AuctionTimerProps {
    endTime: string | null
    className?: string
    variant?: 'default' | 'compact' | 'large'
}

export function AuctionTimer({ endTime, className, variant = 'default' }: AuctionTimerProps) {
    const { days, hours, minutes, seconds, isExpired, totalSeconds } = useAuctionCountdown(endTime)

    if (isExpired) {
        return (
            <div className={cn('flex items-center gap-1.5 text-slate-500', className)}>
                <AlertCircle size={14} />
                <span className={variant === 'large' ? 'text-sm font-semibold' : 'text-xs font-medium'}>
                    Lelang Telah Selesai
                </span>
            </div>
        )
    }

    const isCritical = totalSeconds < 3600      // < 1 jam
    const isVeryClritical = totalSeconds < 300  // < 5 menit

    const timeUnits = days > 0
        ? [
            { value: days, label: 'Hari' },
            { value: hours, label: 'Jam' },
            { value: minutes, label: 'Menit' },
        ]
        : hours > 0
            ? [
                { value: hours, label: 'Jam' },
                { value: minutes, label: 'Menit' },
                { value: seconds, label: 'Detik' },
            ]
            : [
                { value: minutes, label: 'Menit' },
                { value: seconds, label: 'Detik' },
            ]

    if (variant === 'compact') {
        const formatted = days > 0
            ? `${days}h ${hours}j`
            : hours > 0
                ? `${hours}j ${minutes}m`
                : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

        return (
            <div className={cn(
                'flex items-center gap-1.5',
                isCritical ? 'text-red-500' : 'text-slate-600',
                className
            )}>
                <Clock size={13} className={isVeryClritical ? 'animate-pulse' : ''} />
                <span className="text-xs font-semibold">{formatted}</span>
            </div>
        )
    }

    return (
        <div className={cn('space-y-2', className)}>
            <div className="flex items-center gap-1.5">
                <Clock
                    size={13}
                    className={cn(
                        'shrink-0',
                        isCritical ? 'text-red-500' : 'text-slate-400'
                    )}
                />
                <span className={cn(
                    'text-xs font-semibold uppercase tracking-wide',
                    isCritical ? 'text-red-500' : 'text-slate-400'
                )}>
                    {isCritical ? '⚡ Segera Berakhir' : 'Waktu Tersisa'}
                </span>
            </div>

            <div className="flex items-center gap-2">
                {timeUnits.map((unit, i) => (
                    <div key={unit.label} className="flex items-center gap-2">
                        {i > 0 && (
                            <span className={cn(
                                'font-bold text-lg',
                                isCritical ? 'text-red-400' : 'text-slate-300'
                            )}>:</span>
                        )}
                        <div className={cn(
                            'flex flex-col items-center',
                            variant === 'large' ? 'min-w-[56px]' : 'min-w-[40px]'
                        )}>
                            <div className={cn(
                                'font-black tabular-nums rounded-xl flex items-center justify-center w-full',
                                variant === 'large'
                                    ? 'text-3xl h-14 bg-slate-50 border border-slate-100'
                                    : 'text-xl h-10 bg-slate-50 border border-slate-100',
                                isCritical && 'bg-red-50 border-red-100 text-red-600',
                                isVeryClritical && 'animate-pulse'
                            )}>
                                {String(unit.value).padStart(2, '0')}
                            </div>
                            <span className={cn(
                                'text-[9px] font-semibold uppercase tracking-wider mt-1',
                                isCritical ? 'text-red-400' : 'text-slate-400'
                            )}>
                                {unit.label}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}