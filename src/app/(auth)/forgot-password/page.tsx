/**
 * app/(auth)/forgot-password/page.tsx
 */

import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Lupa Password — Cukain Aja' }

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#0B1D3A] tracking-tight">Lupa Password?</h1>
        <p className="text-slate-500 text-sm mt-1">
          Masukkan email akunmu dan kami kirim link reset.
        </p>
      </div>
      <ForgotPasswordForm />
      <div className="text-center">
        <Link href="/login" className="text-sm text-slate-500 hover:text-[#0B1D3A] transition-colors">
          ← Kembali ke halaman login
        </Link>
      </div>
    </div>
  )
}