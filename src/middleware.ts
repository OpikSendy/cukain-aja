/**
 * middleware.ts — v2 (Fixed)
 *
 * PERUBAHAN dari v1:
 * - Selalu refresh session cookie (wajib untuk Supabase SSR)
 * - /setup-pin bisa diakses setelah login (tidak di-block)
 * - /checkout masuk ke protected user routes
 * - Handling edge case: user login tapi profile belum ada
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Route yang memerlukan auth + role tertentu
const ROLE_ROUTES: Record<string, string[]> = {
  '/seller': ['seller', 'admin'],
  '/admin': ['admin'],
  '/user': ['user', 'seller', 'admin'],
}

// Route yang memerlukan auth tapi tidak perlu role check
// (semua user yang sudah login bisa akses)
const AUTH_ONLY_ROUTES = [
  '/setup-pin',
  '/checkout',
  '/pending-approval',
]

// Route publik yang TIDAK boleh diakses user yang sudah login
// (redirect ke dashboard)
const GUEST_ONLY_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Buat response yang bisa dimodifikasi cookienya
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Set cookie di request (untuk downstream)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          // Buat response baru dengan cookies yang diperbarui
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // PENTING: Selalu panggil getUser() untuk refresh session
  // Ini memperbarui cookie session yang kadaluarsa
  const { data: { user } } = await supabase.auth.getUser()

  // ─── Guest-only routes ──────────────────────────────────────────────────────
  // User yang sudah login tidak perlu ke /login atau /register
  const isGuestOnly = GUEST_ONLY_ROUTES.some(r => pathname.startsWith(r))
  if (isGuestOnly && user) {
    // Ambil profile untuk redirect yang tepat
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, status')
      .eq('id', user.id)
      .single()

    const dashboardUrl = getDashboardUrl(profile?.role, profile?.status)
    return NextResponse.redirect(new URL(dashboardUrl, request.url))
  }

  // ─── Auth-only routes (tidak perlu role check) ──────────────────────────────
  const isAuthOnly = AUTH_ONLY_ROUTES.some(r => pathname.startsWith(r))
  if (isAuthOnly && !user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ─── Role-protected routes ──────────────────────────────────────────────────
  const isRoleProtected = Object.keys(ROLE_ROUTES).some(r => pathname.startsWith(r))

  if (isRoleProtected) {
    // Belum login → ke login page
    if (!user) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Ambil profile untuk cek role + status
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, status')
      .eq('id', user.id)
      .single()

    // Profile tidak ada — edge case (user baru, trigger belum jalan)
    if (!profile) {
      // Biarkan akses, profile akan dibuat saat halaman load
      return supabaseResponse
    }

    // Cek role per route
    for (const [route, allowedRoles] of Object.entries(ROLE_ROUTES)) {
      if (!pathname.startsWith(route)) continue

      // Role tidak diizinkan
      if (!allowedRoles.includes(profile.role)) {
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }

      // Seller dengan status pending/suspended
      if (route === '/seller') {
        if (profile.status === 'suspended') {
          return NextResponse.redirect(new URL('/unauthorized', request.url))
        }
        if (profile.status === 'pending') {
          return NextResponse.redirect(new URL('/pending-approval', request.url))
        }
      }

      // Admin yang suspended (edge case)
      if (route === '/admin' && profile.status === 'suspended') {
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }
    }
  }

  // Semua check passed — lanjutkan dengan response yang sudah diperbarui cookienya
  return supabaseResponse
}

// ─── Helper ──────────────────────────────────────────────────────────────────

function getDashboardUrl(role?: string, status?: string): string {
  if (role === 'admin') return '/admin/dashboard'
  if (role === 'seller' && status === 'active') return '/seller/dashboard'
  if (role === 'seller') return '/pending-approval'
  return '/user/dashboard'
}

// ─── Matcher ─────────────────────────────────────────────────────────────────

export const config = {
  matcher: [
    /*
     * Match semua route KECUALI:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - File dengan extension gambar
     * - api routes (handle sendiri)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
}