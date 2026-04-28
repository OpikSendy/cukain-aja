/**
 * app/(admin)/products/page.tsx — RSC
 *
 * Admin view: semua produk dengan filter status + quick actions.
 */
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { AdminProductTable } from '@/components/admin/AdminProductTable'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Kelola Produk — Admin Cukain Aja' }

const STATUS_FILTERS = [
    { label: 'Semua', value: '' },
    { label: 'Pending', value: 'pending' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' },
    { label: 'Terjual', value: 'sold' },
    { label: 'Draft', value: 'draft' },
]

export default async function AdminProductsPage({
    searchParams,
}: {
    searchParams: { status?: string; search?: string }
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') redirect('/unauthorized')

    const activeStatus = searchParams.status ?? ''

    let query = supabase
        .from('products')
        .select(`
      id, title, status, type, price, created_at, is_verified_beacukai,
      product_images(image_url, is_primary),
      profiles(id, name)
    `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(50)

    if (activeStatus) query = query.eq('status', activeStatus as never)
    if (searchParams.search) query = query.ilike('title', `%${searchParams.search}%`)

    const { data: products, count } = await query

    // Counts per status untuk tab badges
    const { data: statusCounts } = await supabase
        .from('products')
        .select('status')

    const countByStatus = (statusCounts ?? []).reduce<Record<string, number>>((acc, p) => {
        acc[p.status!] = (acc[p.status!] ?? 0) + 1
        return acc
    }, {})

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#0B1D3A]">Kelola Produk</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        {count ?? 0} produk ditemukan
                    </p>
                </div>
            </div>

            {/* Status filter tabs */}
            <div className="flex gap-1.5 flex-wrap border-b border-slate-100 pb-0">
                {STATUS_FILTERS.map((filter) => {
                    const isActive = activeStatus === filter.value
                    const cnt = filter.value
                        ? countByStatus[filter.value] ?? 0
                        : Object.values(countByStatus).reduce((a, b) => a + b, 0)

                    return (
                        <Link
                            key={filter.value}
                            href={filter.value ? `?status=${filter.value}` : '/admin/products'}
                            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold
                border-b-2 transition-all -mb-px whitespace-nowrap ${isActive
                                    ? 'border-[#0B1D3A] text-[#0B1D3A]'
                                    : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {filter.label}
                            {cnt > 0 && (
                                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${isActive
                                    ? 'bg-[#0B1D3A] text-white'
                                    : 'bg-slate-100 text-slate-500'
                                    }`}>
                                    {cnt}
                                </span>
                            )}
                        </Link>
                    )
                })}
            </div>

            <AdminProductTable
                products={products as any ?? []}
                searchQuery={searchParams.search}
            />
        </div>
    )
}