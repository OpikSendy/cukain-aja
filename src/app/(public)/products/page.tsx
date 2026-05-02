/**
 * app/(public)/products/page.tsx — Public product listing (RSC)
 */
import { createAdminClient } from '@/lib/supabase/admin'
import { ProductCard } from '@/components/shared/ProductCard'
import { Search } from 'lucide-react'
import type { Metadata } from 'next'
import type { ProductWithImages } from '@/lib/types'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Produk — Cukain Aja',
  description: 'Browse barang bea cukai terverifikasi',
}

export default async function PublicProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; type?: string; category?: string }>
}) {
  const params = await searchParams
  const supabase = createAdminClient()

  let query = supabase
    .from('products')
    .select('*, product_images(*), profiles(id, name)')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(48)

  if (params.search) {
    query = query.ilike('title', `%${params.search}%`)
  }
  if (params.type && ['fixed', 'auction'].includes(params.type)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query = query.eq('type', params.type as any)
  }

  const { data: products } = await query
  const typedProducts = (products ?? []) as ProductWithImages[]

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#0B1D3A]">Jelajahi Produk</h1>
        <p className="text-slate-500 mt-1">Barang bea cukai terverifikasi, siap dibeli atau dilelang</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form className="flex-1 flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl">
          <Search size={16} className="text-slate-400 shrink-0" />
          <input
            name="search"
            defaultValue={params.search}
            placeholder="Cari produk..."
            className="flex-1 text-sm text-[#0B1D3A] placeholder:text-slate-400 outline-none bg-transparent"
          />
        </form>

        <div className="flex gap-2">
          {[
            { label: 'Semua', value: '' },
            { label: 'Harga Tetap', value: 'fixed' },
            { label: 'Lelang', value: 'auction' },
          ].map((filter) => (
            <a
              key={filter.value}
              href={filter.value ? `?type=${filter.value}` : '/products'}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all
                ${params.type === filter.value || (!params.type && !filter.value)
                  ? 'bg-[#0B1D3A] text-white border-[#0B1D3A]'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
            >
              {filter.label}
            </a>
          ))}
        </div>
      </div>

      {/* Grid */}
      {typedProducts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-slate-500">Tidak ada produk yang ditemukan.</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-400">{typedProducts.length} produk ditemukan</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {typedProducts.map((product) => (
              <ProductCard key={product.id} product={product} showSeller />
            ))}
          </div>
        </>
      )}
    </div>
  )
}