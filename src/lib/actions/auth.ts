/**
 * lib/actions/auth.ts — v3 (Fixed)
 *
 * PERUBAHAN dari v2:
 * - register(): pakai upsert untuk profile, tidak andalkan trigger saja
 * - register(): handle 'User already registered' lebih baik
 * - login(): return redirect path berdasarkan role + status
 * - Session debug helper untuk development
 */

'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { validateRegister, validateLogin } from '@/lib/utils/validators'
import { setupPin, verifyPin, changePin, removePin, getPinStatus } from '@/lib/services/pin'
import { APP_CONFIG } from '@/constants/config'
import type { ActionResult, Profile, RegisterInput, LoginInput, UserRole, UserStatus } from '@/lib/types'

export { setupPin, verifyPin, changePin, removePin, getPinStatus }

// ─── Register ─────────────────────────────────────────────────────────────────

export interface RegisterResult {
  userId: string
  requiresEmailVerification: boolean
}

export async function register(
  input: RegisterInput
): Promise<ActionResult<RegisterResult>> {
  // 1. Validasi lokal dulu — jangan sampai request tidak perlu
  const validation = validateRegister(input)
  if (!validation.valid) {
    const firstError = Object.values(validation.errors)[0]
    return { data: null, error: firstError }
  }

  const supabase = await createClient()

  // 2. Sign up ke Supabase Auth
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email: input.email.toLowerCase().trim(),
    password: input.password,
    options: {
      // Metadata ini dibaca oleh trigger handle_new_user di DB
      data: {
        name: input.name.trim(),
        role: input.role,
      },
      // URL harus di-whitelist di Supabase Dashboard:
      // Authentication → URL Configuration → Redirect URLs
      // Tambahkan: http://localhost:3000/auth/callback (development)
      //            https://your-domain.com/auth/callback (production)
      emailRedirectTo: `${APP_CONFIG.url}/auth/callback?next=/setup-pin`,
    },
  })

  if (signUpError) {
    const msg = signUpError.message
    console.error('[auth/register] signUp error:', msg)

    // Mapping error Supabase ke pesan Indonesia
    if (
      msg.includes('User already registered') ||
      msg.includes('already registered') ||
      msg.includes('already been registered')
    ) {
      return { data: null, error: 'Email sudah terdaftar. Silakan login.' }
    }
    if (msg.includes('Password should be at least')) {
      return { data: null, error: 'Password minimal 6 karakter.' }
    }
    if (msg.includes('Unable to validate email address')) {
      return { data: null, error: 'Format email tidak valid.' }
    }
    if (msg.includes('signup_disabled')) {
      return { data: null, error: 'Registrasi saat ini tidak tersedia. Hubungi admin.' }
    }
    if (msg.includes('email rate limit')) {
      return { data: null, error: 'Terlalu banyak permintaan. Coba lagi dalam beberapa menit.' }
    }

    return { data: null, error: `Gagal mendaftar: ${msg}` }
  }

  if (!authData.user) {
    return { data: null, error: 'Gagal membuat akun. Coba lagi.' }
  }

  try {
    if (authData.user) {
      await supabase.from('profiles').upsert({
        id: authData.user.id,
        name: input.name.trim(),
        role: input.role as any,
        status: 'pending' as any,
      }, { onConflict: 'id', ignoreDuplicates: true })
    }
  } catch (e) {
    console.warn("Profile creation handled by trigger or failed silently:", e)
  }

  // 3. Upsert profile — JANGAN hanya andalkan trigger
  //
  // Kenapa upsert dan bukan update?
  // - Trigger handle_new_user mungkin belum berjalan
  // - Kalau email confirmation ON, timing trigger bisa berbeda
  // - Upsert aman: insert kalau belum ada, update kalau sudah ada
  //
  // Kenapa tidak pakai service role?
  // - Kita tidak butuhnya karena user yang baru signup
  //   sudah punya auth.uid() yang match dengan profiles.id
  // - RLS profiles allow insert saat auth.uid() = id

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert(
      {
        id: authData.user.id,
        name: input.name.trim(),
        role: input.role,
        status: 'pending',
      },
      {
        onConflict: 'id',
        // Kalau profile sudah ada (dari trigger), update role dan name
        ignoreDuplicates: false,
      }
    )

  if (profileError) {
    // Profile error bukan blocker fatal — log saja
    // Karena trigger mungkin sudah handle ini
    console.warn('[auth/register] Profile upsert warning:', profileError.message)
  }

  // 4. Tentukan apakah perlu verifikasi email
  // - authData.session === null → email confirmation diperlukan
  // - authData.session !== null → langsung bisa login (email confirmation OFF di Supabase)
  const requiresEmailVerification = authData.session === null

  console.info('[auth/register] Success:', {
    userId: authData.user.id,
    role: input.role,
    requiresEmailVerification,
  })

  return {
    data: {
      userId: authData.user.id,
      requiresEmailVerification,
    },
    error: null,
  }
}

// ─── Login ────────────────────────────────────────────────────────────────────

export interface LoginResult {
  userId: string
  role: string
  status: string
  hasPin: boolean
  redirectPath: string
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
    console.error('[auth/login] Error:', msg)

    if (msg.includes('Invalid login credentials')) {
      return { data: null, error: 'Email atau password salah.' }
    }
    if (msg.includes('Email not confirmed')) {
      return {
        data: null,
        error: 'Email belum dikonfirmasi. Cek inbox atau folder spam kamu.',
      }
    }
    if (msg.includes('Too many requests')) {
      return { data: null, error: 'Terlalu banyak percobaan. Tunggu beberapa menit.' }
    }
    return { data: null, error: `Gagal login: ${msg}` }
  }

  if (!authData.user || !authData.session) {
    return { data: null, error: 'Gagal membuat sesi. Coba lagi.' }
  }

  // Ambil profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, status, pin_hash')
    .eq('id', authData.user.id)
    .single()

  if (profileError || !profile) {
    // Profile tidak ada — edge case, tapi handle gracefully
    console.error('[auth/login] Profile not found for user:', authData.user.id)

    // Coba buat profile baru
    await supabase.from('profiles').upsert({
      id: authData.user.id,
      name: authData.user.user_metadata?.name ?? 'User',
      role: 'user',
      status: 'active',
    }, { onConflict: 'id', ignoreDuplicates: false })

    return {
      data: {
        userId: authData.user.id,
        role: 'user',
        status: 'active',
        hasPin: false,
        redirectPath: '/user/dashboard',
      },
      error: null,
    }
  }

  // Cek suspended
  if (profile.status === 'suspended') {
    await supabase.auth.signOut()
    return {
      data: null,
      error: 'Akun kamu telah disuspend. Hubungi support untuk bantuan.',
    }
  }

  // Tentukan redirect path berdasarkan role + status
  let redirectPath = '/user/dashboard'
  if (profile.role === 'admin') {
    redirectPath = '/admin/dashboard'
  } else if (profile.role === 'seller') {
    redirectPath = profile.status === 'active'
      ? '/seller/dashboard'
      : '/pending-approval'
  }

  return {
    data: {
      userId: authData.user.id,
      role: profile.role as UserRole,
      status: profile.status as UserStatus,
      hasPin: !!profile.pin_hash,
      redirectPath,
    },
    error: null,
  }
}

// ─── PIN Quick Login ──────────────────────────────────────────────────────────

export async function loginWithPin(
  userId: string,
  pin: string
): Promise<ActionResult<LoginResult>> {
  if (!userId || !pin) {
    return { data: null, error: 'User ID dan PIN wajib diisi' }
  }

  const verifyResult = await verifyPin(userId, pin)
  if (verifyResult.error) {
    return { data: null, error: verifyResult.error }
  }

  const pinData = verifyResult.data!

  if (pinData.isLocked) {
    const until = pinData.lockedUntil
      ? new Date(pinData.lockedUntil).toLocaleTimeString('id-ID', {
        hour: '2-digit', minute: '2-digit',
      })
      : 'beberapa menit lagi'
    return { data: null, error: `PIN terkunci sampai ${until}. Gunakan password untuk login.` }
  }

  if (!pinData.success) {
    const left = pinData.attemptsLeft ?? 0
    return {
      data: null,
      error: left > 0
        ? `PIN salah. ${left} percobaan tersisa.`
        : 'PIN salah. Akun terkunci selama 15 menit.',
    }
  }

  const { createAdminClient } = await import('@/lib/supabase/admin')
  const adminClient = createAdminClient()

  const [profileResult, userResult] = await Promise.all([
    adminClient.from('profiles').select('role, status, pin_hash').eq('id', userId).single(),
    adminClient.auth.admin.getUserById(userId)
  ])

  const profile = profileResult.data
  const user = userResult.data?.user

  if (profile?.status === 'suspended') {
    return { data: null, error: 'Akun kamu telah disuspend.' }
  }
  if (!user?.email) {
    return { data: null, error: 'Gagal mendapatkan data user untuk login.' }
  }

  // Determine dashboard path
  let redirectPath = '/user/dashboard'
  if (profile?.role === 'admin') redirectPath = '/admin/dashboard'
  else if (profile?.role === 'seller' && profile?.status === 'active') {
    redirectPath = '/seller/dashboard'
  }

  // Step 1: Generate magic link to get the hashed_token
  const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
    type: 'magiclink',
    email: user.email,
  })

  if (linkError || !linkData?.properties?.hashed_token) {
    console.error('[loginWithPin] generateLink failed:', linkError)
    return { data: null, error: 'Gagal membuat token login.' }
  }

  // Step 2: Exchange token for session SERVER-SIDE (sets cookies via next/headers)
  const { cookies } = await import('next/headers')
  const { createServerClient } = await import('@supabase/ssr')
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: sessionData, error: sessionError } = await supabase.auth.verifyOtp({
    token_hash: linkData.properties.hashed_token,
    type: 'magiclink',
  })

  if (sessionError || !sessionData.session) {
    console.error('[loginWithPin] verifyOtp failed:', sessionError)
    return { data: null, error: 'Gagal membuat sesi login via PIN.' }
  }

  // Session is now in cookies — client just needs to navigate
  return {
    data: {
      userId,
      role: (profile?.role as UserRole) ?? 'user',
      status: (profile?.status as UserStatus) ?? 'active',
      hasPin: true,
      redirectPath, // ← dashboard path, NOT a magic link URL
    },
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
  if (!email?.trim() || !email.includes('@')) {
    return { data: null, error: 'Masukkan email yang valid.' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(
    email.toLowerCase().trim(),
    {
      redirectTo: `${APP_CONFIG.url}/auth/callback?next=/reset-password`,
    }
  )

  if (error) {
    console.error('[auth/forgotPassword]', error.message)
    // Jangan expose apakah email ada — keamanan
  }

  // Selalu return sukses (jangan bocorkan info email terdaftar atau tidak)
  return { data: null, error: null }
}

// ─── Reset Password ───────────────────────────────────────────────────────────

export async function resetPassword(newPassword: string): Promise<ActionResult> {
  if (!newPassword || newPassword.length < 8) {
    return { data: null, error: 'Password minimal 8 karakter.' }
  }
  if (!/[a-zA-Z]/.test(newPassword) || !/\d/.test(newPassword)) {
    return { data: null, error: 'Password harus mengandung huruf dan angka.' }
  }

  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return {
      data: null,
      error: 'Link reset tidak valid atau sudah kadaluarsa. Minta ulang.',
    }
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword })

  if (error) {
    if (error.message.includes('same password')) {
      return { data: null, error: 'Password baru tidak boleh sama dengan yang lama.' }
    }
    return { data: null, error: 'Gagal mengubah password. Coba lagi.' }
  }

  return { data: null, error: null }
}

// ─── Resend Verification ──────────────────────────────────────────────────────

export async function resendVerificationEmail(email: string): Promise<ActionResult> {
  if (!email?.trim()) return { data: null, error: 'Email wajib diisi.' }

  const supabase = await createClient()

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: email.toLowerCase().trim(),
    options: {
      emailRedirectTo: `${APP_CONFIG.url}/auth/callback?next=/setup-pin`,
    },
  })

  if (error) {
    console.error('[auth/resend]', error.message)
    if (error.message.includes('rate limit')) {
      return { data: null, error: 'Terlalu sering. Tunggu beberapa menit.' }
    }
  }

  // Selalu return sukses
  return { data: null, error: null }
}

// ─── Auth Callback ────────────────────────────────────────────────────────────

export async function exchangeCodeForSession(code: string): Promise<ActionResult> {
  const supabase = await createClient()

  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    console.error('[auth/callback]', error.message)
    return { data: null, error: 'Link tidak valid atau sudah kadaluarsa.' }
  }

  return { data: null, error: null }
}

// ─── Session & Profile ────────────────────────────────────────────────────────

export async function getSession(): Promise<ActionResult<{
  user: { id: string; email: string }
  profile: Profile
}>> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { data: null, error: 'Tidak ada sesi aktif.' }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) return { data: null, error: 'Profile tidak ditemukan.' }

  return {
    data: { user: { id: user.id, email: user.email! }, profile },
    error: null,
  }
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

  if (error || !profile) return { data: null, error: 'Gagal mengambil profile.' }
  return { data: profile, error: null }
}

export async function updateProfile(data: { name?: string; phone?: string; address?: string; city?: string; province?: string; postal_code?: string }): Promise<ActionResult<Profile>> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { data: null, error: 'Unauthorized' }

  const updates: Record<string, string> = {}
  if (data.name?.trim()) updates.name = data.name.trim()
  if (data.phone?.trim() !== undefined) updates.phone = data.phone.trim()
  if (data.address?.trim() !== undefined) updates.address = data.address.trim()
  if (data.city?.trim() !== undefined) updates.city = data.city.trim()
  if (data.province?.trim() !== undefined) updates.province = data.province.trim()
  if (data.postal_code?.trim() !== undefined) updates.postal_code = data.postal_code.trim()

  const { data: profile, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single()

  if (error || !profile) return { data: null, error: 'Gagal mengupdate profile.' }
  return { data: profile, error: null }
}