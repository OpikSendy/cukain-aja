'use client'

import { useEffect } from 'react'
import { RefreshCw, Home, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log ke monitoring service (Sentry, dll) di production
    console.error('[ErrorBoundary]', error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-red-50 border border-red-100 rounded-2xl
          flex items-center justify-center mx-auto mb-5">
          <AlertTriangle className="text-red-400" size={28} />
        </div>

        <h2 className="text-xl font-bold text-[#0B1D3A] mb-2">
          Ada yang tidak beres
        </h2>
        <p className="text-slate-500 text-sm leading-relaxed mb-6">
          Terjadi kesalahan yang tidak terduga. Coba muat ulang halaman,
          atau hubungi kami jika masalah berlanjut.
        </p>

        {/* Error digest untuk debugging */}
        {error.digest && (
          <p className="text-[10px] text-slate-300 font-mono mb-5">
            Error ID: {error.digest}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <button
            onClick={reset}
            className="flex items-center justify-center gap-2 px-5 py-2.5
              bg-[#0B1D3A] text-white rounded-xl font-semibold text-sm
              hover:bg-[#0B1D3A]/90 transition-colors"
          >
            <RefreshCw size={15} />
            Coba Lagi
          </button>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-5 py-2.5
              border border-slate-200 text-slate-600 rounded-xl font-semibold text-sm
              hover:bg-slate-50 transition-colors"
          >
            <Home size={15} />
            Beranda
          </Link>
        </div>
      </div>
    </div>
  )
}