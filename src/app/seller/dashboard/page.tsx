/**
 * app/(seller)/dashboard/page.tsx — RSC
 */
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { StatCard } from '@/components/shared/EmptyState'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatRupiah, formatDate } from '@/lib/utils/format'
import { Package, Gavel, TrendingUp, Clock, Plus, ArrowRight, AlertCircle } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Seller Dashboard — Cukain Aja' }

export default async function SellerDashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const [productsRes, profileRes] = await Promise.all([
        supabase
            .from('products')
            .select('*, product_images(image_url, is_primary)')
            .eq('seller_id', user.id)
            .order('created_at', { ascending: false }),
        supabase.from('profiles').select('name').eq('id', user.id).single(),
    ])

    const products = productsRes.data ?? []

    const stats = {
        total: products.length,
        approved: products.filter(p => p.status === 'approved').length,
        pending: products.filter(p => p.status === 'pending').length,
        rejected: products.filter(p => p.status === 'rejected').length,
        draft: products.filter(p => p.status === 'draft').length,
    }

    const recentProducts = products.slice(0, 5)

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#0B1D3A]">Seller Dashboard</h1>
                    <p className="text-slate-500 text-sm mt-1">Halo, {profileRes.data?.name?.split(' ')[0]} 👋</p>
                </div>
                <Link href="/seller/products/new"
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#0B1D3A] text-white
            rounded-xl text-sm font-semibold hover:bg-[#0B1D3A]/90 transition-colors">
                    <Plus size={16} />
                    Tambah Produk
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Produk" value={stats.total} icon={<Package size={18} />} />
                <StatCard label="Disetujui" value={stats.approved} icon={<TrendingUp size={18} />} accent="#22c55e" />
                <StatCard label="Menunggu Review" value={stats.pending} icon={<Clock size={18} />} accent="#C8960C" />
                <StatCard label="Draft" value={stats.draft} icon={<Package size={18} />} accent="#8b5cf6" />
            </div>

            {/* Rejected warning */}
            {stats.rejected > 0 && (
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl">
                    <AlertCircle size={18} className="text-red-500 shrink-0" />
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-red-700">
                            {stats.rejected} produk ditolak
                        </p>
                        <p className="text-xs text-red-500 mt-0.5">
                            Perbaiki produk yang ditolak dan submit ulang.
                        </p>
                    </div>
                    <Link href="/seller/products"
                        className="text-xs font-semibold text-red-600 hover:text-red-800 transition-colors shrink-0">
                        Lihat →
                    </Link>
                </div>
            )}

            {/* Recent products */}
            <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
                    <h2 className="font-semibold text-[#0B1D3A]">Produk Terbaru</h2>
                    <Link href="/seller/products"
                        className="text-xs font-semibold text-[#0B1D3A] hover:text-[#C8960C]
              flex items-center gap-1 transition-colors">
                        Lihat Semua <ArrowRight size={13} />
                    </Link>
                </div>

                {recentProducts.length === 0 ? (
                    <div className="px-6 py-10 text-center">
                        <p className="text-slate-400 text-sm">Belum ada produk. Mulai upload sekarang!</p>
                        <Link href="/seller/products/new"
                            className="inline-block mt-3 text-sm font-semibold text-[#0B1D3A]
                hover:text-[#C8960C] transition-colors">
                            + Tambah Produk Pertama
                        </Link>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-50">
                        {recentProducts.map((product) => {
                            const image =
                                product.product_images.find((i) => i.is_primary === true)
                                ?? product.product_images[0] ?? product.product_images[0]
                            return (
                                <div key={product.id} className="flex items-center gap-4 px-6 py-4">
                                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-50 shrink-0">
                                        {image?.image_url
                                            ? <img src={image.image_url} alt="" className="w-full h-full object-cover" />
                                            : <div className="w-full h-full flex items-center justify-center">
                                                <Package className="text-slate-200" size={16} />
                                            </div>
                                        }
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-[#0B1D3A] truncate">{product.title}</p>
                                        <p className="text-xs text-slate-400 mt-0.5">{formatDate(product.created_at)}</p>
                                    </div>
                                    <StatusBadge status={product.status!} size="sm" />
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}