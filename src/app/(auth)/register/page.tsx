import { RegisterForm } from '@/components/auth/RegisterForm'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Daftar — Cukain Aja',
  description: 'Buat akun Cukain Aja dan mulai jual beli barang bea cukai resmi',
}

export default function RegisterPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#0B1D3A] tracking-tight">
          Buat Akun Baru
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Sudah punya akun?{' '}
          <Link href="/login" className="text-[#0B1D3A] font-semibold hover:text-[#C8960C] transition-colors">
            Masuk di sini
          </Link>
        </p>
      </div>

      <RegisterForm />
    </div>
  )
}