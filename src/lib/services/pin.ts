/**
 * lib/services/pin.ts
 *
 * Service untuk PIN management: hashing, verifikasi, dan brute-force protection.
 * PIN digunakan untuk:
 *   1. Quick-login (tanpa password penuh)
 *   2. Konfirmasi pembayaran (Phase 5)
 *
 * SECURITY:
 * - PIN di-hash dengan bcrypt (saltRounds: 12) sebelum disimpan ke DB
 * - Max 3 percobaan salah → lockout 15 menit (ditangani DB function)
 * - PIN asli tidak pernah disimpan
 *
 * SERVER ONLY — jangan import di 'use client' files.
 */

import bcrypt from 'bcryptjs'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ActionResult } from '@/lib/types'

// ─── Constants ────────────────────────────────────────────────────────────────

const SALT_ROUNDS = 12
const PIN_LENGTH = 6
const PIN_REGEX = /^\d{6}$/

// ─── Validation ───────────────────────────────────────────────────────────────

export function isValidPinFormat(pin: string): boolean {
  return PIN_REGEX.test(pin)
}

/** Cek PIN tidak terlalu simpel (semua angka sama atau berurutan) */
export function isPinTooSimple(pin: string): boolean {
  // Semua angka sama: 000000, 111111, dll
  if (/^(\d)\1+$/.test(pin)) return true

  // Berurutan naik: 123456
  const ascending = Array.from({ length: PIN_LENGTH }, (_, i) => i).join('')
  if (pin === ascending) return true

  // Berurutan turun: 654321
  const descending = Array.from({ length: PIN_LENGTH }, (_, i) => PIN_LENGTH - 1 - i).join('')
  if (pin === descending) return true

  return false
}

// ─── Hashing ──────────────────────────────────────────────────────────────────

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, SALT_ROUNDS)
}

export async function verifyPinHash(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash)
}

// ─── Setup PIN ────────────────────────────────────────────────────────────────

export interface SetupPinInput {
  pin: string
  confirmPin: string
}

export async function setupPin(input: SetupPinInput): Promise<ActionResult> {
  // Validasi format
  if (!isValidPinFormat(input.pin)) {
    return { data: null, error: 'PIN harus 6 digit angka' }
  }

  if (input.pin !== input.confirmPin) {
    return { data: null, error: 'PIN dan konfirmasi PIN tidak cocok' }
  }

  if (isPinTooSimple(input.pin)) {
    return { data: null, error: 'PIN terlalu mudah ditebak. Gunakan kombinasi yang lebih unik.' }
  }

  const supabase = await createClient()

  // Auth check
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { data: null, error: 'Unauthorized' }

  // Hash PIN sebelum simpan
  const pinHash = await hashPin(input.pin)

  const { error } = await supabase
    .from('profiles')
    .update({
      pin_hash: pinHash,
      pin_attempts: 0,
      pin_locked_until: null,
      pin_set_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) return { data: null, error: 'Gagal menyimpan PIN' }

  return { data: null, error: null }
}

// ─── Verify PIN (Quick Login) ─────────────────────────────────────────────────

export interface VerifyPinResult {
  success: boolean
  attemptsLeft?: number
  lockedUntil?: string
  isLocked?: boolean
}

export async function verifyPin(
  userId: string,
  pin: string
): Promise<ActionResult<VerifyPinResult>> {
  if (!isValidPinFormat(pin)) {
    return { data: null, error: 'Format PIN tidak valid' }
  }

  const adminClient = createAdminClient()

  // Ambil data profile untuk cek lock dan hash menggunakan admin client (bypass RLS karena user belum login)
  const { data: profile, error: profileError } = await adminClient
    .from('profiles')
    .select('pin_hash, pin_attempts, pin_locked_until')
    .eq('id', userId)
    .single()

  if (profileError || !profile) {
    return { data: null, error: 'User tidak ditemukan' }
  }

  // Cek apakah PIN sudah di-setup
  if (!profile.pin_hash) {
    return { data: null, error: 'PIN belum di-setup. Setup PIN terlebih dahulu.' }
  }

  // Cek lockout
  if (profile.pin_locked_until) {
    const lockedUntil = new Date(profile.pin_locked_until)
    if (lockedUntil > new Date()) {
      return {
        data: {
          success: false,
          isLocked: true,
          lockedUntil: lockedUntil.toISOString(),
        },
        error: null,
      }
    }
  }

  // Verifikasi PIN
  const isMatch = await verifyPinHash(pin, profile.pin_hash)

  if (isMatch) {
    // Reset attempts
    await adminClient.rpc('reset_pin_attempts', { p_user_id: userId })
    return { data: { success: true }, error: null }
  }

  // PIN salah — increment attempts
  const { data: attemptResult } = await adminClient
    .rpc('increment_pin_attempts', { p_user_id: userId })

  const result = attemptResult as {
    attempts: number
    locked_until: string | null
    is_locked: boolean
  } | null

  const attemptsLeft = Math.max(0, 3 - (result?.attempts ?? 0))

  return {
    data: {
      success: false,
      attemptsLeft,
      isLocked: result?.is_locked ?? false,
      lockedUntil: result?.locked_until ?? undefined,
    },
    error: null,
  }
}

// ─── Change PIN ───────────────────────────────────────────────────────────────

export async function changePin(
  currentPin: string,
  newPin: string,
  confirmNewPin: string
): Promise<ActionResult> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { data: null, error: 'Unauthorized' }

  // Validasi format
  if (!isValidPinFormat(newPin)) {
    return { data: null, error: 'PIN baru harus 6 digit angka' }
  }

  if (newPin !== confirmNewPin) {
    return { data: null, error: 'PIN baru dan konfirmasi tidak cocok' }
  }

  if (isPinTooSimple(newPin)) {
    return { data: null, error: 'PIN terlalu mudah ditebak' }
  }

  // Verifikasi PIN lama dulu
  const verifyResult = await verifyPin(user.id, currentPin)
  if (verifyResult.error) return { data: null, error: verifyResult.error }
  if (!verifyResult.data?.success) {
    const left = verifyResult.data?.attemptsLeft
    return {
      data: null,
      error: left !== undefined ? `PIN lama salah. ${left} percobaan tersisa.` : 'PIN lama salah',
    }
  }

  // Hash PIN baru
  const newPinHash = await hashPin(newPin)

  const { error } = await supabase
    .from('profiles')
    .update({
      pin_hash: newPinHash,
      pin_set_at: new Date().toISOString(),
      pin_attempts: 0,
      pin_locked_until: null,
    })
    .eq('id', user.id)

  if (error) return { data: null, error: 'Gagal mengubah PIN' }

  return { data: null, error: null }
}

// ─── Remove PIN ───────────────────────────────────────────────────────────────

export async function removePin(currentPin: string): Promise<ActionResult> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { data: null, error: 'Unauthorized' }

  const verifyResult = await verifyPin(user.id, currentPin)
  if (!verifyResult.data?.success) {
    return { data: null, error: 'PIN salah' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      pin_hash: null,
      pin_set_at: null,
      pin_attempts: 0,
      pin_locked_until: null,
    })
    .eq('id', user.id)

  if (error) return { data: null, error: 'Gagal menghapus PIN' }

  return { data: null, error: null }
}

// ─── Check PIN Status ─────────────────────────────────────────────────────────

export interface PinStatus {
  hasPin: boolean
  isLocked: boolean
  lockedUntil: string | null
  attemptsLeft: number
  pinSetAt: string | null
}

export async function getPinStatus(userId: string): Promise<ActionResult<PinStatus>> {
  const supabase = await createClient()

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('pin_hash, pin_attempts, pin_locked_until, pin_set_at')
    .eq('id', userId)
    .single()

  if (error) return { data: null, error: 'Gagal cek status PIN' }

  const now = new Date()
  const lockedUntil = profile.pin_locked_until ? new Date(profile.pin_locked_until) : null
  const isLocked = lockedUntil !== null && lockedUntil > now

  return {
    data: {
      hasPin: !!profile.pin_hash,
      isLocked,
      lockedUntil: isLocked ? profile.pin_locked_until : null,
      attemptsLeft: Math.max(0, 3 - (profile.pin_attempts ?? 0)),
      pinSetAt: profile.pin_set_at ?? null,
    },
    error: null,
  }
}