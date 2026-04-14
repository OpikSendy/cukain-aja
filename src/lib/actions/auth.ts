/**
 * lib/actions/auth.ts — v2
 *
 * Server Actions untuk authentication lengkap:
 * - Register + Email Verification
 * - Login (password & PIN)
 * - Forgot Password + Reset Password
 * - Session & Cookie Management
 * - PIN Setup / Change / Remove
 */

'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { validateRegister, validateLogin } from '@/lib/utils/validators'
import { setupPin, verifyPin, changePin, removePin, getPinStatus } from '@/lib/services/pin'
import { APP_CONFIG } from '@/constants/config'
import type { ActionResult, Profile, RegisterInput, LoginInput } from '@/lib/types'

export { setupPin, verifyPin, changePin, removePin, getPinStatus }

// ─── Session Config ───────────────────────────────────────────────────────────

export const SESSION_CONFIG = {
  accessTokenExpiresIn: 60 * 60 * 24,           // 24 jam
  refreshTokenExpiresIn: 60 * 60 * 24 * 7,       // 7 hari
  rememberMeExpiresIn: 60 * 60 * 24 * 30,        // 30 hari
} as const

// ─── Register ─────────────────────────────────────────────────────────────────

export async function register(
  input: RegisterInput
): Promise<ActionResult<{ userId: string; requiresEmailVerification: boolean }>> {
  const validation = validateRegister(input)
  if (!validation.valid) {
    return { data: null, error: Object.values(validation.errors)[0] }
  }

  const supabase = await createClient()

  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email: input.email.toLowerCase().trim(),
    password: input.password,
    options: {
      data: { name: input.name.trim(), role: input.role },
      emailRedirectTo: `${APP_CONFIG.url}/auth/callback?next=/setup-pin`,
    },
  })

  if (signUpError) {
    const msg = signUpError.message
    if (msg.includes('already registered') || msg.includes('already been registered')) {
      return { data: null, error: 'Email sudah terdaftar. Silakan login.' }
    }
    if (msg.includes('Password should be')) {
      return { data: null, error: 'Password minimal 6 karakter' }
    }
    return { data: null, error: 'Gagal mendaftar. Coba lagi beberapa saat.' }
  }

  if (!authData.user) return { data: null, error: 'Gagal membuat akun' }

  if (input.role !== 'user') {
    await supabase.from('profiles').update({ role: input.role }).eq('id', authData.user.id)
  }

  return {
    data: {
      userId: authData.user.id,
      requiresEmailVerification: !authData.session,
    },
    error: null,
  }
}

// ─── Login ────────────────────────────────────────────────────────────────────

export interface LoginResult {
  role: string
  hasPin: boolean
  status: string
}

export async function login(
  input: LoginInput,
  rememberMe: boolean = false
): Promise<ActionResult<LoginResult>> {
  const validation = validateLogin(input)
  if (!validation.valid) {
    return { data: null, error: Object.values(validation.errors)[0] }
  }

  const supabase = await createClient()

  const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
    email: input.email.toLowerCase().trim(),
    password: input.password,
  })

  if (signInError) {
    const msg = signInError.message
    if (msg.includes('Invalid login credentials')) {
      return { data: null, error: 'Email atau password salah' }
    }
    if (msg.includes('Email not confirmed')) {
      return { data: null, error: 'Email belum dikonfirmasi. Cek inbox atau folder spam kamu.' }
    }
    if (msg.includes('Too many requests')) {
      return { data: null, error: 'Terlalu banyak percobaan. Coba lagi dalam beberapa menit.' }
    }
    return { data: null, error: 'Gagal login. Coba lagi.' }
  }

  if (!authData.user || !authData.session) {
    return { data: null, error: 'Gagal login' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, status, pin_hash')
    .eq('id', authData.user.id)
    .single()

  if (profile?.status === 'suspended') {
    await supabase.auth.signOut()
    return { data: null, error: 'Akun kamu telah disuspend. Hubungi support.' }
  }

  return {
    data: {
      role: profile?.role ?? 'user',
      hasPin: !!profile?.pin_hash,
      status: profile?.status ?? 'pending',
    },
    error: null,
  }
}

// ─── PIN Quick Login ──────────────────────────────────────────────────────────

export async function loginWithPin(
  userId: string,
  pin: string
): Promise<ActionResult<LoginResult>> {
  const verifyResult = await verifyPin(userId, pin)

  if (verifyResult.error) return { data: null, error: verifyResult.error }

  const pinData = verifyResult.data!

  if (pinData.isLocked) {
    const until = pinData.lockedUntil
      ? new Date(pinData.lockedUntil).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      : 'beberapa menit lagi'
    return { data: null, error: `PIN terkunci sampai ${until}. Gunakan password untuk login.` }
  }

  if (!pinData.success) {
    const left = pinData.attemptsLeft ?? 0
    return {
      data: null,
      error: left > 0 ? `PIN salah. ${left} percobaan tersisa.` : 'PIN salah. Akun terkunci 15 menit.',
    }
  }

  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, status, pin_hash')
    .eq('id', userId)
    .single()

  if (profile?.status === 'suspended') {
    return { data: null, error: 'Akun kamu telah disuspend.' }
  }

  return {
    data: { role: profile?.role ?? 'user', hasPin: true, status: profile?.status ?? 'active' },
    error: null,
  }
}

// ─── Logout ───────────────────────────────────────────────────────────────────

export async function logout(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

// ─── Forgot Password ──────────────────────────────────────────────────────────

export async function forgotPassword(email: string): Promise<ActionResult> {
  if (!email || !email.includes('@')) {
    return { data: null, error: 'Masukkan email yang valid' }
  }

  const supabase = await createClient()

  await supabase.auth.resetPasswordForEmail(email.toLowerCase().trim(), {
    redirectTo: `${APP_CONFIG.url}/auth/callback?next=/reset-password`,
  })

  // Selalu return success — tidak expose apakah email ada atau tidak
  return { data: null, error: null }
}

// ─── Reset Password ───────────────────────────────────────────────────────────

export async function resetPassword(newPassword: string): Promise<ActionResult> {
  if (!newPassword || newPassword.length < 8) {
    return { data: null, error: 'Password minimal 8 karakter' }
  }
  if (!/[a-zA-Z]/.test(newPassword) || !/\d/.test(newPassword)) {
    return { data: null, error: 'Password harus mengandung huruf dan angka' }
  }

  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { data: null, error: 'Link reset tidak valid atau sudah kadaluarsa. Minta ulang.' }
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword })

  if (error) {
    if (error.message.includes('same password')) {
      return { data: null, error: 'Password baru tidak boleh sama dengan yang lama' }
    }
    return { data: null, error: 'Gagal mengubah password. Coba lagi.' }
  }

  return { data: null, error: null }
}

// ─── Resend Verification ──────────────────────────────────────────────────────

export async function resendVerificationEmail(email: string): Promise<ActionResult> {
  if (!email) return { data: null, error: 'Email wajib diisi' }

  const supabase = await createClient()

  await supabase.auth.resend({
    type: 'signup',
    email: email.toLowerCase().trim(),
    options: { emailRedirectTo: `${APP_CONFIG.url}/auth/callback?next=/setup-pin` },
  })

  return { data: null, error: null }
}

// ─── Auth Callback ────────────────────────────────────────────────────────────

export async function exchangeCodeForSession(code: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) return { data: null, error: 'Link tidak valid atau sudah kadaluarsa' }
  return { data: null, error: null }
}

// ─── Session & Profile ────────────────────────────────────────────────────────

export async function getSession(): Promise<ActionResult<{
  user: { id: string; email: string }
  profile: Profile
}>> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { data: null, error: 'Tidak ada sesi aktif' }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) return { data: null, error: 'Profile tidak ditemukan' }

  return { data: { user: { id: user.id, email: user.email! }, profile }, error: null }
}

export async function getProfile(): Promise<ActionResult<Profile>> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { data: null, error: 'Unauthorized' }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) return { data: null, error: 'Gagal mengambil profile' }
  return { data: profile, error: null }
}

export async function updateProfile(name: string): Promise<ActionResult<Profile>> {
  if (!name || name.trim().length < 2) return { data: null, error: 'Nama minimal 2 karakter' }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { data: null, error: 'Unauthorized' }

  const { data: profile, error } = await supabase
    .from('profiles')
    .update({ name: name.trim() })
    .eq('id', user.id)
    .select()
    .single()

  if (error) return { data: null, error: 'Gagal mengupdate profile' }
  return { data: profile, error: null }
}