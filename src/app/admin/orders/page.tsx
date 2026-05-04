/**
 * app/admin/orders/page.tsx
 *
 * Halaman manajemen pesanan untuk admin.
 * Tampilkan semua order dengan status dan opsi input resi.
 */

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatRupiah, formatDateTime, ORDER_STATUS_LABEL } from '@/lib/utils/format'
import {
  ShoppingBag, Truck, Package, ChevronRight,
  Clock, CheckCircle, XCircle, Filter
} from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Manajemen Pesanan — Admin Cukain Aja' }

interface Props {
  searchParams: Promise<{ status?: string }>
}

export default async function AdminOrdersPage({ searchParams }: Props) {
  const sp = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/unauthorized')

  const adminClient = createAdminClient()

  // Ambil orders
  let query = adminClient
    .from('orders')
    .select(`
      id, status, total_price, payment_method, created_at, user_id,
      order_items(quantity, products(id, title)),
      payments(payment_status),
      profiles(name, email)
    `)
    .order('created_at', { ascending: false })

  if (sp.status) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query = query.eq('status', sp.status as any)
  }

  const { data: orders } = await query

  // Ambil shipments yang ada untuk highlight order yang sudah ada resi
  const { data: shipments } = await (adminClient as any)
    .from('shipments')
    .select('order_id, internal_tracking_id, courier, status')

  const shipmentMap = new Map<string, any>((shipments as any[])?.map((s: any) => [s.order_id, s]) ?? [])

  // Count per status untuk filter tabs
  const { data: counts } = await adminClient
    .from('orders')
    .select('status')

  const statusCounts = (counts ?? []).reduce<Record<string, number>>((acc, o) => {
    acc[o.status!] = (acc[o.status!] ?? 0) + 1
    return acc
  }, {})

  type OrderRow = typeof orders extends (infer T)[] | null ? T : never

  const STATUS_FILTERS = [
    { value: '', label: 'Semua', icon: <Filter size={13} /> },
    { value: 'pending', label: 'Menunggu', icon: <Clock size={13} /> },
    { value: 'paid', label: 'Dibayar', icon: <CheckCircle size={13} /> },
    { value: 'shipped', label: 'Dikirim', icon: <Truck size={13} /> },
    { value: 'completed', label: 'Selesai', icon: <CheckCircle size={13} /> },
    { value: 'canceled', label: 'Dibatalkan', icon: <XCircle size={13} /> },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-[#0B1D3A] flex items-center gap-2">
          <ShoppingBag size={24} className="text-[#C8960C]" />
          Manajemen Pesanan
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Kelola semua pesanan dan input resi pengiriman
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => {
          const isActive = (sp.status ?? '') === f.value
          const count = f.value
            ? (statusCounts[f.value] ?? 0)
            : Object.values(statusCounts).reduce((a, b) => a + b, 0)

          return (
            <Link
              key={f.value}
              href={f.value ? `/admin/orders?status=${f.value}` : '/admin/orders'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold
                border transition-all ${isActive
                  ? 'bg-[#0B1D3A] text-white border-[#0B1D3A]'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-[#0B1D3A]/30'
                }`}
            >
              {f.icon}
              {f.label}
              <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                {count}
              </span>
            </Link>
          )
        })}
      </div>

      {/* Orders Table */}
      {!orders || orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
          <Package size={40} className="text-slate-200 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-400">
            {sp.status ? `Tidak ada pesanan dengan status "${ORDER_STATUS_LABEL[sp.status]}"` : 'Belum ada pesanan'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const shipment = shipmentMap.get(order.id)
            const items = (order.order_items as { quantity: number; products: { id: string; title: string } | null }[])
            const buyer = order.profiles as { name: string | null; email: string | null } | null
            const needsResi = order.status === 'paid'

            return (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className={`block bg-white border rounded-2xl p-5 hover:shadow-md transition-all group ${
                  needsResi
                    ? 'border-amber-300 bg-amber-50/40'
                    : 'border-slate-100 hover:border-[#0B1D3A]/20'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Order ID & Status */}
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <code className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </code>
                      <StatusBadge status={order.status!} />
                      {needsResi && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full">
                          <Truck size={10} />
                          Butuh Resi
                        </span>
                      )}
                      {shipment && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                          <Truck size={10} />
                          {shipment.internal_tracking_id}
                        </span>
                      )}
                    </div>

                    {/* Buyer */}
                    {buyer && (
                      <p className="text-xs text-slate-500 mb-1.5">
                        <span className="font-semibold text-[#0B1D3A]">{buyer.name ?? 'Pembeli'}</span>
                        {' · '}{buyer.email}
                      </p>
                    )}

                    {/* Items */}
                    <p className="text-sm text-slate-700 truncate">
                      {items.map(i => i.products?.title ?? 'Produk').join(', ')}
                    </p>

                    <p className="text-xs text-slate-400 mt-1">{formatDateTime(order.created_at)}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-lg font-black text-[#0B1D3A]">{formatRupiah(order.total_price)}</p>
                    <ChevronRight size={16} className="text-slate-300 ml-auto mt-1 group-hover:text-[#0B1D3A] transition-colors" />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
