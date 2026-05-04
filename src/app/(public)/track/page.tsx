/**
 * app/(public)/track/page.tsx
 *
 * Halaman tracking paket publik Cukain Aja.
 * Dapat diakses tanpa login. Cukup masukkan nomor resi CKJ-...
 */

import { Truck } from 'lucide-react'
import { TrackingClient } from './TrackingClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Lacak Paket — Cukain Aja',
  description: 'Lacak status pengiriman paket Cukain Aja menggunakan nomor resi internal CKJ-...',
}

interface Props {
  searchParams: Promise<{ id?: string }>
}

export default async function TrackPage({ searchParams }: Props) {
  const sp = await searchParams

  return (
    <div className="min-h-screen bg-[#F8F7F4]">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-[#0B1D3A] to-[#1a3a6e] py-16 px-4">
        <div className="max-w-xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-xs font-semibold
            px-3 py-1.5 rounded-full mb-4 border border-white/20">
            <Truck size={13} />
            Sistem Pengiriman Cukain Aja
          </div>
          <h1 className="text-3xl font-black text-white mb-3">
            Lacak Paket Anda
          </h1>
          <p className="text-blue-200 text-sm leading-relaxed">
            Masukkan nomor resi internal Cukain Aja (format <code className="font-mono bg-white/10 px-1.5 py-0.5 rounded">CKJ-YYYYMMDD-XXXXXX</code>)
            untuk melihat status pengiriman secara real-time.
          </p>
        </div>
      </div>

      {/* Tracking Area */}
      <div className="max-w-xl mx-auto px-4 -mt-6">
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200 p-6 mb-8">
          <TrackingClient initialId={sp.id} />
        </div>
      </div>

      {/* Info Kurir Section */}
      <div className="max-w-xl mx-auto px-4 pb-16">
        <p className="text-center text-xs text-slate-400 font-semibold uppercase tracking-wider mb-4">
          Kurir Partner Kami
        </p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { name: 'JNE', color: '#CC0000' },
            { name: 'J&T Express', color: '#E31E24' },
            { name: 'SiCepat', color: '#F26522' },
            { name: 'Wahana', color: '#003087' },
            { name: 'Pos Indonesia', color: '#FF6600' },
            { name: 'AnterAja', color: '#FFCC00' },
          ].map((c) => (
            <div
              key={c.name}
              className="bg-white border border-slate-100 rounded-xl py-3 px-2 text-center
                text-xs font-bold transition-all hover:shadow-sm"
              style={{ color: c.color, borderColor: `${c.color}30` }}
            >
              {c.name}
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Punya pertanyaan?{' '}
          <a href="mailto:support@cukainaja.id" className="text-[#0B1D3A] font-semibold hover:underline">
            Hubungi support@cukainaja.id
          </a>
        </p>
      </div>
    </div>
  )
}
