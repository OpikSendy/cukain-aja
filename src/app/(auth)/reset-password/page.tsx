/**
 * app/(auth)/reset-password/page.tsx
 */
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Reset Password — Cukain Aja' }

export default function ResetPasswordPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#0B1D3A] tracking-tight">Buat Password Baru</h1>
        <p className="text-slate-500 text-sm mt-1">
          Password baru harus berbeda dari yang sebelumnya.
        </p>
      </div>
      <ResetPasswordForm />
    </div>
  )
}