/**
 * app/(admin)/dashboard/page.tsx — RSC
 */
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { StatCard } from '@/components/shared/EmptyState'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatDate, formatRupiah } from '@/lib/utils/format'
import { Users, Package, ShoppingBag, FileCheck, ArrowRight, AlertCircle } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Admin Dashboard — Cukain Aja' }

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminClient = createAdminClient()

  const [usersRes, productsRes, ordersRes, pendingRes] = await Promise.all([
    adminClient.from('profiles').select('id', { count: 'exact', head: true }),
    adminClient.from('products').select('id', { count: 'exact', head: true }),
    adminClient.from('orders').select('id, total_price').limit(100),
    adminClient.from('products').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
  ])

  const totalRevenue = (ordersRes.data ?? []).reduce((sum, o) => sum + (Number(o.total_price) || 0), 0)

  // Recent items for quick view
  const { data: recentProducts } = await adminClient
    .from('products')
    .select('id, title, status, created_at, profiles(name)')
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: pendingSellers } = await adminClient
    .from('profiles')
    .select('id, name, created_at')
    .eq('role', 'seller')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(5)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#0B1D3A]">Admin Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Pantau dan kelola seluruh platform.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Pengguna" value={usersRes.count ?? 0} icon={<Users size={18} />} />
        <StatCard label="Total Produk" value={productsRes.count ?? 0} icon={<Package size={18} />} />
        <StatCard label="Menunggu Review" value={pendingRes.count ?? 0} icon={<FileCheck size={18} />} accent="#C8960C" />
        <StatCard label="Total Transaksi" value={formatRupiah(totalRevenue)} icon={<ShoppingBag size={18} />} accent="#22c55e" />
      </div>

      {/* Pending seller alert */}
      {pendingSellers && pendingSellers.length > 0 && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-100 rounded-2xl">
          <AlertCircle size={18} className="text-amber-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">
              {pendingSellers.length} seller menunggu persetujuan
            </p>
          </div>
          <Link href="/admin/users"
            className="text-xs font-semibold text-amber-700 hover:text-amber-900 transition-colors">
            Review →
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent products */}
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
            <h2 className="font-semibold text-[#0B1D3A]">Produk Terbaru</h2>
            <Link href="/admin/verifications"
              className="text-xs font-semibold text-[#0B1D3A] hover:text-[#C8960C]
                flex items-center gap-1 transition-colors">
              Review <ArrowRight size={13} />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {(recentProducts ?? []).map((product) => (
              <div key={product.id} className="flex items-center gap-3 px-6 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#0B1D3A] truncate">{product.title}</p>
                  <p className="text-xs text-slate-400">
                    {(product.profiles as { name: string } | null)?.name} · {formatDate(product.created_at)}
                  </p>
                </div>
                <StatusBadge status={product.status!} size="sm" />
              </div>
            ))}
          </div>
        </div>

        {/* Pending sellers */}
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
            <h2 className="font-semibold text-[#0B1D3A]">Seller Menunggu Approval</h2>
            <Link href="/admin/users"
              className="text-xs font-semibold text-[#0B1D3A] hover:text-[#C8960C]
                flex items-center gap-1 transition-colors">
              Lihat Semua <ArrowRight size={13} />
            </Link>
          </div>
          {pendingSellers && pendingSellers.length > 0 ? (
            <div className="divide-y divide-slate-50">
              {pendingSellers.map((seller) => (
                <div key={seller.id} className="flex items-center gap-3 px-6 py-3">
                  <div className="w-8 h-8 bg-[#0B1D3A] rounded-full flex items-center justify-center shrink-0">
                    <span className="text-[#C8960C] text-xs font-bold uppercase">
                      {seller.name?.charAt(0) ?? 'S'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#0B1D3A] truncate">{seller.name}</p>
                    <p className="text-xs text-slate-400">Daftar {formatDate(seller.created_at)}</p>
                  </div>
                  <StatusBadge status="pending" size="sm" />
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-10 text-center">
              <p className="text-slate-400 text-sm">Semua seller sudah diproses ✓</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}