/**
 * lib/utils/tracking.ts
 *
 * Utilities untuk sistem pengiriman Cukain Aja:
 * - Generate internal tracking ID (format: CKJ-YYYYMMDD-XXXXXX)
 * - Helper label dan URL kurir
 */

import { COURIER_LIST, SHIPPING_CONFIG, type CourierType } from '@/constants/config'

// ─── Internal Tracking ID ─────────────────────────────────────────────────────

/**
 * Generate nomor resi internal Cukain Aja.
 * Format: CKJ-YYYYMMDD-XXXXXX (6 karakter alphanumeric uppercase)
 * Contoh: CKJ-20260503-A1B2C3
 */
export function generateInternalTrackingId(): string {
  const prefix = SHIPPING_CONFIG.trackingIdPrefix
  const date = new Date()
  const datePart = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('')

  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no confusable chars (0,O,1,I)
  let randomPart = ''
  for (let i = 0; i < SHIPPING_CONFIG.trackingIdLength; i++) {
    randomPart += chars[Math.floor(Math.random() * chars.length)]
  }

  return `${prefix}-${datePart}-${randomPart}`
}

/**
 * Validasi format internal tracking ID
 */
export function isValidTrackingId(id: string): boolean {
  return /^CKJ-\d{8}-[A-Z0-9]{6}$/.test(id)
}

// ─── Courier Helpers ──────────────────────────────────────────────────────────

/**
 * Ambil data kurir berdasarkan ID
 */
export function getCourierInfo(courierId: CourierType) {
  return COURIER_LIST.find(c => c.id === courierId) ?? null
}

/**
 * Nama display kurir
 */
export function getCourierLabel(courierId: CourierType): string {
  return getCourierInfo(courierId)?.label ?? courierId.toUpperCase()
}

/**
 * URL tracking langsung ke website kurir
 */
export function getCourierTrackingUrl(courierId: CourierType, trackingNumber: string): string {
  const info = getCourierInfo(courierId)
  if (!info) return '#'
  return `${info.trackUrl}${encodeURIComponent(trackingNumber)}`
}

/**
 * Warna brand kurir
 */
export function getCourierColor(courierId: CourierType): string {
  return getCourierInfo(courierId)?.color ?? '#64748b'
}

// ─── Shipment Status Helpers ──────────────────────────────────────────────────

export type ShipmentStatus =
  | 'processing'
  | 'picked_up'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'failed'

export const SHIPMENT_STATUS_LABEL: Record<ShipmentStatus, string> = {
  processing:        'Diproses',
  picked_up:         'Dijemput Kurir',
  in_transit:        'Dalam Pengiriman',
  out_for_delivery:  'Sedang Diantarkan',
  delivered:         'Terkirim',
  failed:            'Gagal Kirim',
}

export const SHIPMENT_STATUS_STEPS: ShipmentStatus[] = [
  'processing',
  'picked_up',
  'in_transit',
  'out_for_delivery',
  'delivered',
]

export function getShipmentStatusLabel(status: ShipmentStatus): string {
  return SHIPMENT_STATUS_LABEL[status] ?? status
}

export function getShipmentStatusIndex(status: ShipmentStatus): number {
  return SHIPMENT_STATUS_STEPS.indexOf(status)
}
