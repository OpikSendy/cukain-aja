/**
 * app/(seller)/auctions/new/page.tsx — RSC
 */
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CreateAuctionForm } from '@/components/seller/CreateAuctionForm'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Buat Lelang — Cukain Aja' }

export default async function NewAuctionPage({
    searchParams,
}: {
    searchParams: Promise<{ product?: string }>
}) {
    const params = await searchParams
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Produk approved + type auction milik seller ini
    const { data: availableProducts } = await supabase
        .from('products')
        .select('id, title')
        .eq('seller_id', user.id)
        .eq('status', 'approved')
        .eq('type', 'auction')

    if (!availableProducts || availableProducts.length === 0) {
        return (
            <div className="max-w-lg space-y-6">
                <Link href="/seller/auctions"
                    className="flex items-center gap-2 text-sm text-slate-500 hover:text-[#0B1D3A] transition-colors">
                    <ArrowLeft size={16} />Kembali
                </Link>
                <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center space-y-3">
                    <AlertCircle className="mx-auto text-amber-400" size={32} />
                    <h2 className="font-bold text-[#0B1D3A]">Belum Ada Produk yang Bisa Dilelang</h2>
                    <p className="text-slate-500 text-sm">
                        Kamu perlu memiliki produk bertipe &quot;Lelang&quot; yang sudah disetujui admin.
                    </p>
                    <Link href="/seller/products/new"
                        className="inline-block px-5 py-2.5 bg-[#0B1D3A] text-white rounded-xl
              text-sm font-semibold hover:bg-[#0B1D3A]/90 transition-colors">
                        Tambah Produk Baru
                    </Link>
                </div>
            </div>
        )
    }

    // Default ke produk yang dipilih dari query param, atau produk pertama
    const selectedProduct = availableProducts.find(p => p.id === params.product)
        ?? availableProducts[0]

    return (
        <div className="max-w-lg space-y-8">
            <div>
                <Link href="/seller/auctions"
                    className="flex items-center gap-2 text-sm text-slate-500 hover:text-[#0B1D3A] transition-colors mb-4">
                    <ArrowLeft size={16} />Kembali
                </Link>
                <h1 className="text-2xl font-bold text-[#0B1D3A]">Buat Lelang Baru</h1>
                <p className="text-slate-500 text-sm mt-1">
                    Set waktu dan harga awal untuk lelang produk kamu.
                </p>
            </div>

            {/* Product selector (jika lebih dari satu) */}
            {availableProducts.length > 1 && (
                <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">Pilih Produk</label>
                    <div className="space-y-2">
                        {availableProducts.map((product) => (
                            <Link
                                key={product.id}
                                href={`/seller/auctions/new?product=${product.id}`}
                                className={`block p-3.5 rounded-xl border-2 text-sm font-medium transition-all
                  ${selectedProduct.id === product.id
                                        ? 'border-[#0B1D3A] bg-[#0B1D3A]/5 text-[#0B1D3A]'
                                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                                    }`}
                            >
                                {product.title}
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            <CreateAuctionForm
                productId={selectedProduct.id}
                productTitle={selectedProduct.title}
            />
        </div>
    )
}