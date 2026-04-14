/**
 * app/auth/callback/route.ts
 *
 * Handler untuk Supabase Auth callbacks:
 * - Email verification
 * - Password reset
 * - OAuth (future)
 *
 * Flow:
 * 1. Supabase redirect ke /auth/callback?code=xxx&next=/target
 * 2. Exchange code → session
 * 3. Redirect ke `next` atau default route
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/types/database'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/user/dashboard'
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Handle error dari Supabase
  if (error) {
    console.error('[auth/callback] Supabase error:', error, errorDescription)
    const redirectUrl = new URL('/login', origin)
    redirectUrl.searchParams.set('error', errorDescription ?? error)
    return NextResponse.redirect(redirectUrl)
  }

  if (!code) {
    return NextResponse.redirect(new URL('/login', origin))
  }

  const cookieStore = await cookies()

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    console.error('[auth/callback] Exchange error:', exchangeError)
    const redirectUrl = new URL('/login', origin)
    redirectUrl.searchParams.set('error', 'Link tidak valid atau sudah kadaluarsa')
    return NextResponse.redirect(redirectUrl)
  }

  // Pastikan `next` tidak mengarah ke domain lain (open redirect prevention)
  const safeNext = next.startsWith('/') ? next : '/user/dashboard'

  return NextResponse.redirect(new URL(safeNext, origin))
}