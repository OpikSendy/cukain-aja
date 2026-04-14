/**
 * app/(auth)/layout.tsx
 *
 * Layout untuk semua halaman auth.
 * Kalau user sudah login, redirect ke dashboard.
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    // Ambil role untuk redirect ke dashboard yang tepat
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, status')
      .eq('id', user.id)
      .single()

    if (profile?.role === 'admin') redirect('/admin/dashboard')
    if (profile?.role === 'seller' && profile?.status === 'active') redirect('/seller/dashboard')
    redirect('/user/dashboard')
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left Panel: Branding ── */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#0B1D3A] flex-col justify-between p-12 overflow-hidden">

        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, #C8960C 0%, transparent 50%),
                              radial-gradient(circle at 80% 20%, #1A3A6B 0%, transparent 40%)`,
          }}
        />

        {/* Grid lines decoration */}
        <div className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `linear-gradient(#C8960C 1px, transparent 1px),
                              linear-gradient(90deg, #C8960C 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#C8960C] rounded-lg flex items-center justify-center">
              <span className="text-[#0B1D3A] font-black text-lg">C</span>
            </div>
            <span className="text-white font-bold text-xl tracking-tight">Cukain Aja</span>
          </div>
        </div>

        {/* Center content */}
        <div className="relative z-10 space-y-6">
          <div>
            <p className="text-[#C8960C] text-sm font-semibold tracking-widest uppercase mb-3">
              Marketplace Resmi
            </p>
            <h2 className="text-white text-4xl font-bold leading-tight">
              Barang Bea Cukai
              <br />
              <span className="text-[#C8960C]">Transparan.</span>
              <br />
              <span className="text-[#C8960C]">Terpercaya.</span>
            </h2>
          </div>

          <p className="text-slate-400 text-base leading-relaxed max-w-sm">
            Platform jual beli dan lelang barang sitaan bea cukai Indonesia
            yang terverifikasi, aman, dan mudah diakses.
          </p>

          {/* Stats */}
          <div className="flex gap-8 pt-4">
            {[
              { label: 'Produk Terverifikasi', value: '2.400+' },
              { label: 'Transaksi Aman', value: '98%' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-white text-2xl font-bold">{stat.value}</p>
                <p className="text-slate-500 text-xs mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: Trust badges */}
        <div className="relative z-10">
          <p className="text-slate-600 text-xs mb-3">Terdaftar & Diawasi:</p>
          <div className="flex gap-3">
            {['DJBC', 'Kemenkeu', 'OJK'].map((badge) => (
              <div
                key={badge}
                className="px-3 py-1.5 border border-slate-700 rounded text-slate-500 text-xs font-medium"
              >
                {badge}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Panel: Form ── */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 bg-white">
        {/* Mobile logo */}
        <div className="flex items-center gap-2 mb-8 lg:hidden">
          <div className="w-8 h-8 bg-[#0B1D3A] rounded-lg flex items-center justify-center">
            <span className="text-[#C8960C] font-black">C</span>
          </div>
          <span className="text-[#0B1D3A] font-bold text-lg">Cukain Aja</span>
        </div>

        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  )
}