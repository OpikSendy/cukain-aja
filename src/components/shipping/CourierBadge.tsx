'use client'

/**
 * components/shipping/CourierBadge.tsx
 *
 * Badge kurir dengan nama dan warna brand.
 * Link ke website kurir untuk cek resi eksternal.
 */

import { ExternalLink } from 'lucide-react'
import { getCourierInfo, getCourierTrackingUrl } from '@/lib/utils/tracking'
import type { CourierType } from '@/constants/config'

interface CourierBadgeProps {
  courier: CourierType
  trackingNumber?: string
  showLink?: boolean
  size?: 'sm' | 'md'
}

export function CourierBadge({
  courier,
  trackingNumber,
  showLink = true,
  size = 'md',
}: CourierBadgeProps) {
  const info = getCourierInfo(courier)
  if (!info) return null

  const trackUrl = trackingNumber
    ? getCourierTrackingUrl(courier, trackingNumber)
    : null

  const sizeClasses = size === 'sm'
    ? 'px-2 py-0.5 text-[11px] gap-1'
    : 'px-3 py-1.5 text-xs gap-1.5'

  const dot = (
    <span
      className="inline-block w-2 h-2 rounded-full shrink-0"
      style={{ backgroundColor: info.color }}
    />
  )

  const content = (
    <span className={`inline-flex items-center font-bold rounded-full border ${sizeClasses}`}
      style={{
        color: info.color,
        borderColor: `${info.color}33`,
        backgroundColor: `${info.color}12`,
      }}
    >
      {dot}
      {info.label}
      {showLink && trackingNumber && (
        <ExternalLink size={10} className="opacity-60" />
      )}
    </span>
  )

  if (showLink && trackUrl && trackingNumber) {
    return (
      <a
        href={trackUrl}
        target="_blank"
        rel="noopener noreferrer"
        title={`Cek resi ${info.label}`}
        className="hover:opacity-80 transition-opacity"
      >
        {content}
      </a>
    )
  }

  return content
}
