/**
 * lib/utils/validators.ts
 *
 * Validasi input untuk forms dan server actions.
 * Pure functions — tidak ada side effects.
 */

import type { RegisterInput, LoginInput, CreateProductInput, CreateAuctionInput } from '@/lib/types'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean
  errors: Record<string, string>
}

// ─── Field Validators ─────────────────────────────────────────────────────────

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function isValidPassword(password: string): boolean {
  // Min 8 karakter, minimal 1 huruf dan 1 angka
  return password.length >= 8 && /[a-zA-Z]/.test(password) && /\d/.test(password)
}

export function isValidPrice(price: number): boolean {
  return price > 0 && Number.isFinite(price)
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// ─── Form Validators ──────────────────────────────────────────────────────────

export function validateRegister(input: RegisterInput): ValidationResult {
  const errors: Record<string, string> = {}

  if (!input.name || input.name.trim().length < 2) {
    errors.name = 'Nama minimal 2 karakter'
  }

  if (!input.name || input.name.trim().length > 100) {
    errors.name = 'Nama maksimal 100 karakter'
  }

  if (!input.email || !isValidEmail(input.email)) {
    errors.email = 'Format email tidak valid'
  }

  if (!input.password || !isValidPassword(input.password)) {
    errors.password = 'Password minimal 8 karakter, mengandung huruf dan angka'
  }

  if (!input.role || !['user', 'seller'].includes(input.role)) {
    errors.role = 'Role tidak valid'
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

export function validateLogin(input: LoginInput): ValidationResult {
  const errors: Record<string, string> = {}

  if (!input.email || !isValidEmail(input.email)) {
    errors.email = 'Format email tidak valid'
  }

  if (!input.password || input.password.length < 1) {
    errors.password = 'Password wajib diisi'
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

export function validateProduct(input: CreateProductInput): ValidationResult {
  const errors: Record<string, string> = {}

  if (!input.title || input.title.trim().length < 3) {
    errors.title = 'Judul produk minimal 3 karakter'
  }

  if (!input.title || input.title.trim().length > 200) {
    errors.title = 'Judul produk maksimal 200 karakter'
  }

  if (!input.description || input.description.trim().length < 10) {
    errors.description = 'Deskripsi minimal 10 karakter'
  }

  if (input.type === 'fixed') {
    if (!input.price || !isValidPrice(input.price)) {
      errors.price = 'Harga tidak valid'
    }
    if (input.price > 1_000_000_000_000) {
      errors.price = 'Harga terlalu besar'
    }
  }

  if (!input.type || !['fixed', 'auction'].includes(input.type)) {
    errors.type = 'Tipe produk tidak valid'
  }

  if (!input.categoryIds || input.categoryIds.length === 0) {
    errors.categoryIds = 'Pilih minimal 1 kategori'
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

export function validateAuction(input: CreateAuctionInput): ValidationResult {
  const errors: Record<string, string> = {}

  if (!input.startPrice || !isValidPrice(input.startPrice)) {
    errors.startPrice = 'Harga awal lelang tidak valid'
  }

  const now = new Date()

  if (!input.startTime || input.startTime <= now) {
    errors.startTime = 'Waktu mulai harus di masa depan'
  }

  if (!input.endTime || input.endTime <= now) {
    errors.endTime = 'Waktu selesai harus di masa depan'
  }

  if (input.startTime && input.endTime && input.endTime <= input.startTime) {
    errors.endTime = 'Waktu selesai harus setelah waktu mulai'
  }

  const durationHours =
    input.startTime && input.endTime
      ? (input.endTime.getTime() - input.startTime.getTime()) / (1000 * 60 * 60)
      : 0

  if (durationHours < 1) {
    errors.endTime = 'Durasi lelang minimal 1 jam'
  }

  if (durationHours > 30 * 24) {
    errors.endTime = 'Durasi lelang maksimal 30 hari'
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

// ─── File Validators ──────────────────────────────────────────────────────────

const IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const DOCUMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024 // 10MB

export function validateImageFile(file: File): ValidationResult {
  const errors: Record<string, string> = {}

  if (!IMAGE_TYPES.includes(file.type)) {
    errors.file = 'Format gambar tidak didukung. Gunakan JPG, PNG, atau WebP'
  }

  if (file.size > MAX_IMAGE_SIZE) {
    errors.file = 'Ukuran gambar maksimal 5MB'
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

export function validateDocumentFile(file: File): ValidationResult {
  const errors: Record<string, string> = {}

  if (!DOCUMENT_TYPES.includes(file.type)) {
    errors.file = 'Format dokumen tidak didukung. Gunakan PDF atau gambar'
  }

  if (file.size > MAX_DOCUMENT_SIZE) {
    errors.file = 'Ukuran dokumen maksimal 10MB'
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

// ─── UUID Validator ───────────────────────────────────────────────────────────

export function isValidUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
}