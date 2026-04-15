'use client'
/**
 * components/shared/StatusBadge.tsx
 */
import { cn } from '@/lib/utils'
import type { ProductStatus, AuctionStatus, OrderStatus, UserStatus, VerificationStatus } from '@/lib/types'

type BadgeStatus =
  | ProductStatus
  | AuctionStatus
  | OrderStatus
  | UserStatus
  | VerificationStatus

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  // Product
  draft:    { label: 'Draft',            className: 'bg-slate-100 text-slate-600 border-slate-200' },
  pending:  { label: 'Menunggu',         className: 'bg-amber-50 text-amber-700 border-amber-200' },
  approved: { label: 'Disetujui',        className: 'bg-green-50 text-green-700 border-green-200' },
  rejected: { label: 'Ditolak',          className: 'bg-red-50 text-red-700 border-red-200' },
  sold:     { label: 'Terjual',          className: 'bg-blue-50 text-blue-700 border-blue-200' },
  // Auction
  upcoming: { label: 'Akan Dimulai',     className: 'bg-purple-50 text-purple-700 border-purple-200' },
  active:   { label: 'Berlangsung',      className: 'bg-green-50 text-green-700 border-green-200 animate-pulse' },
  ended:    { label: 'Selesai',          className: 'bg-slate-100 text-slate-500 border-slate-200' },
  // Order
  paid:     { label: 'Dibayar',          className: 'bg-blue-50 text-blue-700 border-blue-200' },
  shipped:  { label: 'Dikirim',          className: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  completed:{ label: 'Selesai',          className: 'bg-green-50 text-green-700 border-green-200' },
  canceled: { label: 'Dibatalkan',       className: 'bg-red-50 text-red-600 border-red-200' },
  // User
  activeUser:   { label: 'Aktif',           className: 'bg-green-50 text-green-700 border-green-200' },
  suspendedUser:{ label: 'Disuspend',       className: 'bg-red-50 text-red-700 border-red-200' },
}

interface StatusBadgeProps {
  status: BadgeStatus | string
  size?: 'sm' | 'md'
  className?: string
}

export function StatusBadge({ status, size = 'md', className }: StatusBadgeProps) {
  const config = STATUS_MAP[status] ?? {
    label: status,
    className: 'bg-slate-100 text-slate-600 border-slate-200',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center border rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}