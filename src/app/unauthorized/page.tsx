
import Link from 'next/link'
import { ShieldOff, ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Akses Ditolak — Cukain Aja' }

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-[#F8F7F4] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-red-50 border border-red-100 rounded-2xl
          flex items-center justify-center mx-auto mb-5">
          <ShieldOff className="text-red-400" size={28} />
        </div>

        <h1 className="text-2xl font-bold text-[#0B1D3A] mb-2">Akses Ditolak</h1>
        <p className="text-slate-500 text-sm leading-relaxed mb-6">
          Kamu tidak memiliki izin untuk mengakses halaman ini.
          Pastikan kamu sudah login dengan akun yang tepat.
        </p>

        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-5 py-2.5
              bg-[#0B1D3A] text-white rounded-xl font-semibold text-sm
              hover:bg-[#0B1D3A]/90 transition-colors"
          >
            <ArrowLeft size={15} />
            Ke Beranda
          </Link>
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 px-5 py-2.5
              border border-slate-200 text-slate-600 rounded-xl font-semibold text-sm
              hover:bg-slate-50 transition-colors"
          >
            Ganti Akun
          </Link>
        </div>
      </div>
    </div>
  )
}