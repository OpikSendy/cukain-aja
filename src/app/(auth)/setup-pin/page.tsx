/**
 * app/(auth)/setup-pin/page.tsx — Protected RSC
 * Dipanggil setelah register berhasil atau manual dari settings.
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SetupPinForm } from '@/components/auth/SetupPinForm'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Setup PIN — Cukain Aja' }

export default async function SetupPinPage({
  searchParams,
}: {
  searchParams: { skip?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('pin_hash, role')
    .eq('id', user.id)
    .single()

  // Kalau sudah punya PIN, redirect ke dashboard
  if (profile?.pin_hash) {
    const role = profile.role
    if (role === 'admin') redirect('/admin/dashboard')
    if (role === 'seller') redirect('/seller/dashboard')
    redirect('/user/dashboard')
  }

  const dashboardRoute =
    profile?.role === 'admin' ? '/admin/dashboard'
    : profile?.role === 'seller' ? '/seller/dashboard'
    : '/user/dashboard'

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="w-16 h-16 bg-[#C8960C]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🔐</span>
        </div>
        <h1 className="text-2xl font-bold text-[#0B1D3A] tracking-tight">
          Setup PIN Keamanan
        </h1>
        <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto">
          PIN 6 digit digunakan untuk login cepat dan konfirmasi pembayaran.
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
        <p className="text-amber-700 text-xs leading-relaxed">
          <span className="font-semibold">⚠️ Penting:</span> Jangan bagikan PIN ke siapapun.
          Cukain Aja tidak pernah meminta PIN kamu.
        </p>
      </div>

      <SetupPinForm userId={user.id} dashboardRoute={dashboardRoute} />

      <div className="text-center">
        <Link
          href={dashboardRoute}
          className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
        >
          Lewati untuk sekarang →
        </Link>
      </div>
    </div>
  )
}