/**
 * lib/hooks/useAuth.ts
 *
 * Hook untuk mendapatkan auth state di Client Components.
 * Untuk Server Components, gunakan createClient() + supabase.auth.getUser() langsung.
 *
 * PENTING: File ini hanya boleh di-import di Client Components ('use client').
 */

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Profile, UserRole } from '@/lib/types'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthState {
  user: User | null
  profile: Profile | null
  role: UserRole | null
  isLoading: boolean
  isAuthenticated: boolean
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Hook untuk akses auth state di client components.
 *
 * @example
 * const { user, profile, role, isLoading } = useAuth()
 *
 * if (isLoading) return <Spinner />
 * if (!isAuthenticated) return <LoginButton />
 */
export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    role: null,
    isLoading: true,
    isAuthenticated: false,
  })

  const [supabase] = useState(() => createClient())

  useEffect(() => {
    let mounted = true

    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!mounted) return

      if (!user) {
        setState({ user: null, profile: null, role: null, isLoading: false, isAuthenticated: false })
        return
      }

      // Ambil profile untuk role info
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!mounted) return

      setState({
        user,
        profile,
        role: profile?.role ?? null,
        isLoading: false,
        isAuthenticated: true,
      })
    }

    fetchUser()

    // Listen auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        if (event === 'SIGNED_OUT' || !session) {
          setState({ user: null, profile: null, role: null, isLoading: false, isAuthenticated: false })
          return
        }

        if (event === 'SIGNED_IN' && session.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (!mounted) return

          setState({
            user: session.user,
            profile,
            role: profile?.role ?? null,
            isLoading: false,
            isAuthenticated: true,
          })
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return state
}

// ─── Role Guards ──────────────────────────────────────────────────────────────

/**
 * Cek apakah user memiliki role yang diizinkan.
 * Gunakan di client components untuk conditional rendering.
 *
 * @example
 * const { role } = useAuth()
 * if (!hasRole(role, ['admin', 'seller'])) return null
 */
export function hasRole(
  currentRole: UserRole | null,
  allowedRoles: UserRole[]
): boolean {
  if (!currentRole) return false
  return allowedRoles.includes(currentRole)
}

/**
 * Hook singkat untuk cek apakah user adalah admin.
 */
export function useIsAdmin(): boolean {
  const { role } = useAuth()
  return role === 'admin'
}

/**
 * Hook singkat untuk cek apakah user adalah seller.
 */
export function useIsSeller(): boolean {
  const { role } = useAuth()
  return role === 'seller'
}