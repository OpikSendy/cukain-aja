/**
 * app/(public)/page.tsx — Landing Page (RSC)
 *
 * Aesthetic: Refined governmental authority meets modern marketplace.
 * Navy + Gold palette, editorial layout, trust-first messaging.
 */
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/shared/ProductCard'
import {
  ShieldCheck, Gavel, Zap, ArrowRight,
  BadgeCheck, TrendingUp, Lock, Scale
} from 'lucide-react'
import type { ProductWithImages } from '@/lib/types'

export default async function LandingPage() {
  const supabase = await createClient()

  // Produk terbaru untuk preview
  const { data: latestProducts } = await supabase
    .from('products')
    .select('*, product_images(*), profiles(id, name)')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(8)

  // Lelang aktif
  const { data: activeAuctions } = await supabase
    .from('auctions')
    .select('id, current_price, end_time, products(title, product_images(image_url, is_primary))')
    .eq('status', 'active')
    .order('end_time', { ascending: true })
    .limit(3)

  const products = (latestProducts ?? []) as ProductWithImages[]

  return (
    <div className="overflow-x-hidden">

      {/* ─── HERO ────────────────────────────────────────────────────────── */}
      <section className="relative bg-[#0B1D3A] overflow-hidden">
        {/* Background texture */}
        <div className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(ellipse at 20% 60%, rgba(200,150,12,0.12) 0%, transparent 60%),
                              radial-gradient(ellipse at 80% 30%, rgba(200,150,12,0.06) 0%, transparent 50%)`,
          }}
        />
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(rgba(200,150,12,1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(200,150,12,1) 1px, transparent 1px)`,
            backgroundSize: '80px 80px',
          }}
        />

        <div className="relative max-w-6xl mx-auto px-4 py-20 md:py-28">
          <div className="max-w-2xl">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#C8960C]/10
              border border-[#C8960C]/30 rounded-full mb-6">
              <ShieldCheck size={13} className="text-[#C8960C]" />
              <span className="text-[#C8960C] text-xs font-semibold tracking-wide">
                Platform Resmi Bea Cukai Indonesia
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Barang Bea Cukai.
              <br />
              <span className="text-[#C8960C]">Transparan.</span>
              <br />
              <span className="text-[#C8960C]">Terpercaya.</span>
            </h1>

            <p className="text-slate-300 text-lg leading-relaxed mb-8 max-w-lg">
              Marketplace pertama khusus barang lelang dan sitaan bea cukai Indonesia.
              Setiap produk terverifikasi dokumen resmi. Tidak ada perantara, tidak ada drama.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/products"
                className="flex items-center gap-2 px-6 py-3.5 bg-[#C8960C] text-[#0B1D3A]
                  rounded-xl font-bold hover:bg-[#C8960C]/90 transition-colors"
              >
                Jelajahi Produk
                <ArrowRight size={17} />
              </Link>
              <Link
                href="/auctions"
                className="flex items-center gap-2 px-6 py-3.5 border border-white/20
                  text-white rounded-xl font-semibold hover:bg-white/10 transition-colors"
              >
                <Gavel size={17} />
                Ikut Lelang
              </Link>
            </div>

            {/* Stats */}
            <div className="flex gap-8 mt-12 pt-8 border-t border-white/10">
              {[
                { value: '2.400+', label: 'Produk Terdaftar' },
                { value: 'Rp 1,2M+', label: 'Total Transaksi' },
                { value: '98%', label: 'Kepuasan Pembeli' },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── TRUST STRIP ─────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: <BadgeCheck size={20} />, label: 'Terverifikasi DJBC', color: 'text-green-600' },
              { icon: <Lock size={20} />, label: 'Pembayaran Aman', color: 'text-blue-600' },
              { icon: <Scale size={20} />, label: 'Dokumen Legal', color: 'text-[#C8960C]' },
              { icon: <Zap size={20} />, label: 'Proses Cepat', color: 'text-purple-600' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 px-4 py-3">
                <span className={item.color}>{item.icon}</span>
                <span className="text-sm font-medium text-slate-700">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── LELANG AKTIF ─────────────────────────────────────────────────── */}
      {activeAuctions && activeAuctions.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs font-semibold text-green-600 uppercase tracking-wide">
                  Live
                </span>
              </div>
              <h2 className="text-2xl font-bold text-[#0B1D3A]">Lelang Berlangsung</h2>
            </div>
            <Link
              href="/auctions"
              className="flex items-center gap-1.5 text-sm font-semibold text-[#0B1D3A]
                hover:text-[#C8960C] transition-colors"
            >
              Lihat Semua <ArrowRight size={15} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {activeAuctions.map((auction) => {
              const product = auction.products as {
                title: string
                product_images: { image_url: string | null; is_primary: boolean }[]
              } | null
              const image = product?.product_images.find(i => i.is_primary)
                ?? product?.product_images[0]

              return (
                <Link
                  key={auction.id}
                  href={`/auctions/${auction.id}`}
                  className="group bg-white border border-slate-100 rounded-2xl overflow-hidden
                    hover:border-slate-200 hover:shadow-md transition-all"
                >
                  <div className="aspect-video bg-slate-50 overflow-hidden relative">
                    {image?.image_url ? (
                      <img
                        src={image.image_url}
                        alt={product?.title ?? ''}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Gavel className="text-slate-200" size={32} />
                      </div>
                    )}
                    <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1
                      bg-green-500 rounded-full">
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                      <span className="text-white text-[10px] font-bold">LIVE</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-sm font-semibold text-[#0B1D3A] line-clamp-2 mb-2">
                      {product?.title}
                    </p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-slate-400">Penawaran Saat Ini</p>
                        <p className="font-bold text-[#0B1D3A]">
                          Rp {Number(auction.current_price).toLocaleString('id-ID')}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-[#C8960C] bg-[#C8960C]/10
                        px-2.5 py-1 rounded-full">
                        Bid Sekarang →
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* ─── PRODUK TERBARU ──────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[#0B1D3A]">Produk Terbaru</h2>
          <Link
            href="/products"
            className="flex items-center gap-1.5 text-sm font-semibold text-[#0B1D3A]
              hover:text-[#C8960C] transition-colors"
          >
            Lihat Semua <ArrowRight size={15} />
          </Link>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border border-dashed border-slate-200 rounded-2xl">
            <p className="text-slate-400 text-sm">Belum ada produk yang tersedia.</p>
          </div>
        )}
      </section>

      {/* ─── HOW IT WORKS ────────────────────────────────────────────────── */}
      <section className="bg-[#0B1D3A] py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">Cara Kerja</h2>
            <p className="text-slate-400 max-w-lg mx-auto">
              Proses sederhana dan transparan dari listing sampai barang di tangan kamu.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Seller Upload & Verifikasi',
                desc: 'Seller upload produk beserta dokumen bea cukai resmi. Admin Cukain Aja memverifikasi setiap dokumen.',
                icon: <ShieldCheck size={24} />,
              },
              {
                step: '02',
                title: 'Beli atau Ikut Lelang',
                desc: 'Pilih produk dengan harga tetap atau ikut lelang realtime. Semua transaksi dilindungi escrow.',
                icon: <Gavel size={24} />,
              },
              {
                step: '03',
                title: 'Terima Barang',
                desc: 'Pembayaran aman via Midtrans. Barang dikirim langsung dari seller ke kamu.',
                icon: <TrendingUp size={24} />,
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="inline-flex w-14 h-14 bg-[#C8960C]/10 border border-[#C8960C]/20
                  rounded-2xl items-center justify-center text-[#C8960C] mb-4">
                  {item.icon}
                </div>
                <div className="text-[#C8960C]/40 text-5xl font-black mb-2">{item.step}</div>
                <h3 className="text-white font-semibold mb-2">{item.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─────────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="bg-gradient-to-br from-[#0B1D3A] to-[#1A3A6B] rounded-3xl p-10 md:p-14
          text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `radial-gradient(circle at 80% 20%, #C8960C 0%, transparent 60%)`,
            }}
          />
          <div className="relative z-10">
            <h2 className="text-3xl font-bold text-white mb-3">
              Mulai Jual Barang Bea Cukai Kamu
            </h2>
            <p className="text-slate-300 mb-8 max-w-md mx-auto">
              Daftar sebagai seller, upload produk, dan jangkau ribuan pembeli potensial.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                href="/register"
                className="px-8 py-3.5 bg-[#C8960C] text-[#0B1D3A] rounded-xl
                  font-bold hover:bg-[#C8960C]/90 transition-colors"
              >
                Daftar Sekarang — Gratis
              </Link>
              <Link
                href="/products"
                className="px-8 py-3.5 border border-white/20 text-white rounded-xl
                  font-semibold hover:bg-white/10 transition-colors"
              >
                Lihat Produk
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}