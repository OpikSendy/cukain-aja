/**
 * app/not-found.tsx — Global 404
 */
import Link from 'next/link'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#F8F7F4] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Ilustrasi angka 404 */}
        <div className="relative mb-8 select-none">
          <p
            className="text-[120px] md:text-[160px] font-black leading-none tracking-tighter"
            style={{
              background: 'linear-gradient(135deg, #0B1D3A 0%, #C8960C 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            404
          </p>
          {/* Decorative stamp */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="w-28 h-28 border-4 border-[#C8960C] rounded-full flex items-center
                justify-center rotate-[-15deg] opacity-20"
            >
              <span className="text-[#C8960C] font-black text-sm tracking-widest">
                NOT FOUND
              </span>
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-[#0B1D3A] mb-3">
          Halaman Tidak Ditemukan
        </h1>
        <p className="text-slate-500 text-sm leading-relaxed mb-8">
          Halaman yang kamu cari tidak ada atau sudah dipindahkan.
          Mungkin produknya sudah terjual? 😅
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-[#0B1D3A]
              text-white rounded-xl font-semibold text-sm hover:bg-[#0B1D3A]/90 transition-colors"
          >
            <Home size={16} />
            Ke Beranda
          </Link>
          <Link
            href="/products"
            className="flex items-center justify-center gap-2 px-6 py-3 border border-slate-200
              text-slate-600 rounded-xl font-semibold text-sm hover:bg-slate-50 transition-colors"
          >
            Jelajahi Produk
          </Link>
        </div>
      </div>
    </div>
  )
}