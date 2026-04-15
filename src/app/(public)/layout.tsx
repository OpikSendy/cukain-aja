/**
 * app/(public)/layout.tsx — Layout untuk semua halaman public
 */
import { Navbar } from '@/components/layout/Navbar'
import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8F7F4]">
      <Navbar />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-slate-200 bg-white mt-16">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 bg-[#0B1D3A] rounded-lg flex items-center justify-center">
                  <span className="text-[#C8960C] font-black text-sm">C</span>
                </div>
                <span className="font-bold text-[#0B1D3A]">Cukain Aja</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
                Marketplace barang bea cukai resmi Indonesia. Transparan, terverifikasi, terpercaya.
              </p>
            </div>
            {[
              { title: 'Marketplace', links: ['Produk', 'Lelang', 'Kategori'] },
              { title: 'Daftar', links: ['Sebagai Pembeli', 'Sebagai Penjual', 'Cara Kerja'] },
              { title: 'Bantuan', links: ['FAQ', 'Hubungi Kami', 'Syarat & Ketentuan'] },
            ].map((col) => (
              <div key={col.title}>
                <p className="text-xs font-semibold text-[#0B1D3A] uppercase tracking-wider mb-3">{col.title}</p>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link}>
                      <Link href="#" className="text-sm text-slate-400 hover:text-[#0B1D3A] transition-colors">
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-100 mt-8 pt-6 flex items-center justify-between">
            <p className="text-xs text-slate-400">© 2025 Cukain Aja. Hak cipta dilindungi.</p>
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-green-500" />
              <span className="text-xs text-slate-400">Terdaftar di Kemenkeu RI</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}