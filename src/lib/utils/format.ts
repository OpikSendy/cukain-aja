/**
 * lib/utils/format.ts
 *
 * Utility functions untuk formatting: currency, date, string.
 * Semua pure functions — tidak ada side effects.
 */

// ─── Currency ─────────────────────────────────────────────────────────────────

/**
 * Format angka ke format Rupiah Indonesia.
 * @example formatRupiah(150000) → "Rp 150.000"
 */
export function formatRupiah(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return 'Rp 0'

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Parse string Rupiah ke number.
 * @example parseRupiah("Rp 150.000") → 150000
 */
export function parseRupiah(value: string): number {
  return Number(value.replace(/[^0-9]/g, ''))
}

// ─── Date & Time ──────────────────────────────────────────────────────────────

/**
 * Format tanggal ke format Indonesia.
 * @example formatDate("2024-01-15") → "15 Januari 2024"
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-'

  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}

/**
 * Format tanggal + jam.
 * @example formatDateTime("2024-01-15T10:30:00") → "15 Januari 2024, 10.30 WIB"
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-'

  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(new Date(date))
}

/**
 * Hitung sisa waktu dari sekarang ke target date.
 * Digunakan untuk countdown timer auction.
 */
export interface TimeRemaining {
  days: number
  hours: number
  minutes: number
  seconds: number
  isExpired: boolean
  totalSeconds: number
}

export function getTimeRemaining(endTime: string | Date | null): TimeRemaining {
  if (!endTime) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true, totalSeconds: 0 }
  }

  const total = new Date(endTime).getTime() - Date.now()

  if (total <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true, totalSeconds: 0 }
  }

  return {
    days: Math.floor(total / (1000 * 60 * 60 * 24)),
    hours: Math.floor((total / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((total / 1000 / 60) % 60),
    seconds: Math.floor((total / 1000) % 60),
    isExpired: false,
    totalSeconds: Math.floor(total / 1000),
  }
}

/**
 * Format relative time ("2 jam yang lalu", "5 menit lagi").
 */
export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return '-'

  const rtf = new Intl.RelativeTimeFormat('id-ID', { numeric: 'auto' })
  const diff = (new Date(date).getTime() - Date.now()) / 1000

  const thresholds: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, 'second'],
    [3600, 'minute'],
    [86400, 'hour'],
    [2592000, 'day'],
    [31536000, 'month'],
  ]

  for (const [threshold, unit] of thresholds) {
    const prev = thresholds[thresholds.indexOf([threshold, unit]) - 1]
    const divisor = prev ? prev[0] : 1
    if (Math.abs(diff) < threshold) {
      return rtf.format(Math.round(diff / divisor), unit)
    }
  }

  return rtf.format(Math.round(diff / 31536000), 'year')
}

// ─── String ───────────────────────────────────────────────────────────────────

/**
 * Truncate text dengan ellipsis.
 * @example truncate("Barang antik langka", 10) → "Barang ant..."
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trimEnd() + '...'
}

/**
 * Convert string ke slug URL-safe.
 * @example toSlug("Barang Antik Langka") → "barang-antik-langka"
 */
export function toSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Capitalize first letter setiap kata.
 * @example toTitleCase("barang bea cukai") → "Barang Bea Cukai"
 */
export function toTitleCase(text: string): string {
  return text.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
}

/**
 * Format nama file untuk display (hapus UUID prefix dari storage path).
 * @example formatFileName("user-123/invoice_abc123.pdf") → "invoice_abc123.pdf"
 */
export function formatFileName(filePath: string): string {
  return filePath.split('/').pop() ?? filePath
}

// ─── Status Labels ────────────────────────────────────────────────────────────

export const PRODUCT_STATUS_LABEL: Record<string, string> = {
  draft: 'Draft',
  pending: 'Menunggu Verifikasi',
  approved: 'Disetujui',
  rejected: 'Ditolak',
  sold: 'Terjual',
}

export const ORDER_STATUS_LABEL: Record<string, string> = {
  pending: 'Menunggu Pembayaran',
  paid: 'Dibayar',
  shipped: 'Dikirim',
  completed: 'Selesai',
  canceled: 'Dibatalkan',
}

export const AUCTION_STATUS_LABEL: Record<string, string> = {
  upcoming: 'Belum Dimulai',
  active: 'Sedang Berlangsung',
  ended: 'Selesai',
}

export const USER_STATUS_LABEL: Record<string, string> = {
  pending: 'Menunggu Persetujuan',
  active: 'Aktif',
  suspended: 'Disuspend',
}