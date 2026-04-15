/**
 * app/(user)/dashboard/page.tsx — RSC
 */
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { StatCard } from '@/components/shared/EmptyState'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatRupiah, formatDate } from '@/lib/utils/format'
import { ShoppingBag, Gavel, Clock, CheckCircle, ArrowRight } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard — Cukain Aja' }

export default async function UserDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Parallel fetch
  const [ordersRes, bidsRes, profileRes] = await Promise.all([
    supabase
      .from('orders')
      .select('*, order_items(*, products(title))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('bids')
      .select('*, auctions(current_price, status, end_time, products(title))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('profiles').select('name, status').eq('id', user.id).single(),
  ])

  const orders = ordersRes.data ?? []
  const bids = bidsRes.data ?? []
  const profile = profileRes.data

  const stats = {
    totalOrders: orders.length,
    pendingOrders: orders.filter(o => o.status === 'pending').length,
    completedOrders: orders.filter(o => o.status === 'completed').length,
    activeBids: bids.filter(b => (b.auctions as { status: string })?.status === 'active').length,
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#0B1D3A]">
          Selamat datang, {profile?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-slate-500 text-sm mt-1">Ini ringkasan aktivitas akun kamu.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Pesanan" value={stats.totalOrders} icon={<ShoppingBag size={18} />} />
        <StatCard label="Menunggu" value={stats.pendingOrders} icon={<Clock size={18} />} accent="#C8960C" />
        <StatCard label="Selesai" value={stats.completedOrders} icon={<CheckCircle size={18} />} accent="#22c55e" />
        <StatCard label="Bid Aktif" value={stats.activeBids} icon={<Gavel size={18} />} accent="#8b5cf6" />
      </div>

      {/* Recent orders */}
      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
          <h2 className="font-semibold text-[#0B1D3A]">Pesanan Terbaru</h2>
          <Link href="/user/orders"
            className="text-xs font-semibold text-[#0B1D3A] hover:text-[#C8960C] transition-colors
              flex items-center gap-1">
            Lihat Semua <ArrowRight size={13} />
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-slate-400 text-sm">Belum ada pesanan.</p>
            <Link href="/products" className="inline-block mt-3 text-sm font-semibold text-[#0B1D3A]
              hover:text-[#C8960C] transition-colors">
              Mulai belanja →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {orders.map((order) => {
              const firstItem = (order.order_items as { products: { title: string } | null }[])[0]
              return (
                <Link
                  key={order.id}
                  href={`/user/orders/${order.id}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#0B1D3A] truncate">
                      {firstItem?.products?.title ?? 'Pesanan'}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{formatDate(order.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-semibold text-[#0B1D3A]">
                      {formatRupiah(order.total_price)}
                    </span>
                    <StatusBadge status={order.status!} size="sm" />
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Active bids */}
      {bids.length > 0 && (
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-50">
            <h2 className="font-semibold text-[#0B1D3A]">Bid Saya</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {bids.map((bid) => {
              const auction = bid.auctions as {
                current_price: number; status: string; end_time: string;
                products: { title: string } | null
              } | null
              const isWinning = bid.amount >= (auction?.current_price ?? 0)

              return (
                <div key={bid.id} className="flex items-center gap-4 px-6 py-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#0B1D3A] truncate">
                      {auction?.products?.title ?? 'Lelang'}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Bid saya: <span className="font-semibold">{formatRupiah(bid.amount)}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {auction?.status === 'active' && (
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full
                        ${isWinning
                          ? 'bg-green-50 text-green-700'
                          : 'bg-red-50 text-red-600'}`}>
                        {isWinning ? '🏆 Tertinggi' : '↓ Tertandingi'}
                      </span>
                    )}
                    <StatusBadge status={auction?.status ?? 'ended'} size="sm" />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}