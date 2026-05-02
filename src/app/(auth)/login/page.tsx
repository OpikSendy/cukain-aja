/**
 * app/(auth)/login/page.tsx — RSC
 */

import { LoginForm } from '@/components/auth/LoginForm'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Masuk — Cukain Aja',
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#0B1D3A] tracking-tight">
          Selamat Datang Kembali
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Belum punya akun?{' '}
          <Link href="/register" className="text-[#0B1D3A] font-semibold hover:text-[#C8960C] transition-colors">
            Daftar sekarang
          </Link>
        </p>
      </div>

      {params.error && (
        <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
          <p className="text-red-600 text-sm">{params.error}</p>
        </div>
      )}

      <LoginForm />
    </div>
  )
}