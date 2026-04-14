/**
 * lib/actions/auth.ts
 *
 * Server Actions untuk authentication.
 * Semua fungsi di file ini hanya bisa dipanggil dari server.
 */

'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { validateRegister, validateLogin } from '@/lib/utils/validators'
import type { ActionResult, Profile, RegisterInput, LoginInput } from '@/lib/types'

// ─── Register ─────────────────────────────────────────────────────────────────

export async function register(input: RegisterInput): Promise<ActionResult<{ userId: string }>> {
  // 1. Validasi input
  const validation = validateRegister(input)
  if (!validation.valid) {
    const firstError = Object.values(validation.errors)[0]
    return { data: null, error: firstError }
  }

  const supabase = await createClient()

  // 2. Daftarkan ke Supabase Auth
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email: input.email.toLowerCase().trim(),
    password: input.password,
    options: {
      data: {
        name: input.name.trim(),
        role: input.role,
      },
    },
  })

  if (signUpError) {
    // Supabase error codes mapping ke bahasa Indonesia
    if (signUpError.message.includes('already registered')) {
      return { data: null, error: 'Email sudah terdaftar' }
    }
    return { data: null, error: 'Gagal mendaftar. Coba lagi.' }
  }

  if (!authData.user) {
    return { data: null, error: 'Gagal membuat akun' }
  }

  // 3. Update role di profiles (trigger sudah auto-create profile,
  //    tapi role dari metadata mungkin tidak ter-set tergantung trigger)
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ role: input.role })
    .eq('id', authData.user.id)

  if (profileError) {
    // Tidak fatal — role bisa di-update manual oleh admin
    console.error('[auth/register] Failed to set role:', profileError)
  }

  return { data: { userId: authData.user.id }, error: null }
}

// ─── Login ────────────────────────────────────────────────────────────────────

export async function login(input: LoginInput): Promise<ActionResult<{ role: string }>> {
  // 1. Validasi input
  const validation = validateLogin(input)
  if (!validation.valid) {
    const firstError = Object.values(validation.errors)[0]
    return { data: null, error: firstError }
  }

  const supabase = await createClient()

  // 2. Sign in
  const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
    email: input.email.toLowerCase().trim(),
    password: input.password,
  })

  if (signInError) {
    if (signInError.message.includes('Invalid login credentials')) {
      return { data: null, error: 'Email atau password salah' }
    }
    if (signInError.message.includes('Email not confirmed')) {
      return { data: null, error: 'Email belum dikonfirmasi. Cek inbox kamu.' }
    }
    return { data: null, error: 'Gagal login. Coba lagi.' }
  }

  if (!authData.user) {
    return { data: null, error: 'Gagal login' }
  }

  // 3. Ambil profile untuk routing
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, status')
    .eq('id', authData.user.id)
    .single()

  return {
    data: { role: profile?.role ?? 'user' },
    error: null,
  }
}

// ─── Logout ───────────────────────────────────────────────────────────────────

export async function logout(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

// ─── Get Current Session ──────────────────────────────────────────────────────

export async function getSession(): Promise<ActionResult<{ user: { id: string; email: string }; profile: Profile }>> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { data: null, error: 'Tidak ada sesi aktif' }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return { data: null, error: 'Profile tidak ditemukan' }
  }

  return {
    data: {
      user: { id: user.id, email: user.email! },
      profile,
    },
    error: null,
  }
}

// ─── Get Profile ──────────────────────────────────────────────────────────────

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

// ─── Update Profile ───────────────────────────────────────────────────────────

export async function updateProfile(name: string): Promise<ActionResult<Profile>> {
  if (!name || name.trim().length < 2) {
    return { data: null, error: 'Nama minimal 2 karakter' }
  }

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