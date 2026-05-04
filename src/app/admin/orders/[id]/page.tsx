/**
 * app/admin/orders/[id]/page.tsx
 *
 * Halaman detail order untuk admin.
 * Menampilkan info order lengkap + form input resi pengiriman.
 */

import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { AdminOrderDetailClient } from './AdminOrderDetailClient'
import { formatRupiah, formatDateTime } from '@/lib/utils/format'
import { adminUpdatePaymentStatus } from '@/lib/actions/payments'
import {
  ArrowLeft, Package, CreditCard, User,
  ShoppingBag, Truck
} from 'lucide-react'
import type { Metadata } from 'next'
import type { ShipmentData } from '@/lib/actions/shipping'

export const metadata: Metadata = { title: 'Detail Pesanan — Admin Cukain Aja' }

interface Props {
  params: Promise<{ id: string }>
}

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id: orderId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/unauthorized')

  const adminClient = createAdminClient()

  // Ambil order detail
  const { data: order } = await adminClient
    .from('orders')
    .select(`
      id, status, total_price, payment_method, created_at, user_id,
      order_items(id, quantity, price, products(id, title, type, product_images(image_url, is_primary))),
      payments(payment_status, payment_url, midtrans_transaction_id, created_at),
      profiles(name)
    `)
    .eq('id', orderId)
    .single()

  if (!order) notFound()

  // Ambil shipment jika ada
  const { data: shipment } = await (adminClient as any)
    .from('shipments')
    .select('*')
    .eq('order_id', orderId)
    .single()

  type ItemType = {
    id: string; quantity: number; price: number
    products: {
      id: string; title: string; type: string
      product_images: { image_url: string | null; is_primary: boolean }[]
    } | null
  }
  type PaymentType = {
    payment_status: string; payment_url: string | null
    midtrans_transaction_id: string | null; created_at: string | null
  }

  const items = order.order_items as ItemType[]
  const payment = (order.payments as PaymentType[] | null)?.[0] ?? null
  const buyer = order.profiles as { name: string | null; email: string | null } | null

  const canInputResi = order.status === 'paid' || order.status === 'shipped'

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Back nav */}
      <Link
        href="/admin/orders"
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-[#0B1D3A] transition-colors w-fit"
      >
        <ArrowLeft size={16} />
        Kembali ke Pesanan
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-black text-[#0B1D3A] flex items-center gap-2">
            <ShoppingBag size={20} className="text-[#C8960C]" />
            Detail Pesanan
          </h1>
          <code className="text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded font-mono mt-1 inline-block">
            #{order.id}
          </code>
        </div>
        <StatusBadge status={order.status!} />
      </div>

      {/* Buyer Info */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <User size={16} className="text-slate-400" />
          <h2 className="text-sm font-semibold text-[#0B1D3A]">Informasi Pembeli</h2>
        </div>
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Nama</span>
            <span className="font-semibold text-[#0B1D3A]">{buyer?.name ?? '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Tanggal Order</span>
            <span className="font-semibold text-[#0B1D3A]">{formatDateTime(order.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Shipping Address */}
      {(order as any).shipping_name && (
        <div className="bg-white border border-slate-100 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Truck size={16} className="text-slate-400" />
            <h2 className="text-sm font-semibold text-[#0B1D3A]">Alamat Pengiriman</h2>
          </div>
          <div className="space-y-2 text-sm">
            <p className="font-semibold text-[#0B1D3A]">{(order as any).shipping_name}</p>
            <p className="text-slate-500">{(order as any).shipping_phone}</p>
            <p className="text-slate-500 mt-2">
              {(order as any).shipping_address}<br />
              {(order as any).shipping_city}, {(order as any).shipping_province} {(order as any).shipping_postal_code}
            </p>
          </div>
        </div>
      )}

      {/* Products */}
      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-2">
          <Package size={16} className="text-slate-400" />
          <h2 className="text-sm font-semibold text-[#0B1D3A]">Produk ({items.length})</h2>
        </div>
        <div className="divide-y divide-slate-50">
          {items.map((item) => {
            const img = item.products?.product_images?.find(i => i.is_primary)
              ?? item.products?.product_images?.[0]

            return (
              <div key={item.id} className="flex items-center gap-4 px-5 py-4">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-50 shrink-0">
                  {img?.image_url
                    ? <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center">
                        <Package className="text-slate-200" size={16} />
                      </div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#0B1D3A] truncate">
                    {item.products?.title ?? 'Produk'}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {item.quantity}× · {formatRupiah(item.price)}
                  </p>
                </div>
                <p className="text-sm font-bold text-[#0B1D3A] shrink-0">
                  {formatRupiah(item.price * item.quantity)}
                </p>
              </div>
            )
          })}
        </div>
        <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-600">Total</span>
          <span className="text-xl font-black text-[#0B1D3A]">{formatRupiah(order.total_price)}</span>
        </div>
      </div>

      {/* Payment */}
      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-2">
          <CreditCard size={16} className="text-slate-400" />
          <h2 className="text-sm font-semibold text-[#0B1D3A]">Pembayaran</h2>
        </div>
        <div className="px-5 py-4 space-y-2.5 text-sm">
          {[
            { label: 'Metode', value: (order.payment_method ?? 'midtrans').toUpperCase() },
            {
              label: 'Status', value: payment
                ? payment.payment_status === 'settlement' ? '✓ Lunas'
                  : payment.payment_status === 'pending' ? 'Menunggu'
                    : payment.payment_status
                : 'Belum Dibayar',
              cls: payment?.payment_status === 'settlement' ? 'text-green-600' : 'text-amber-600',
            },
            payment?.midtrans_transaction_id ? { label: 'ID Transaksi', value: payment.midtrans_transaction_id } : null,
          ].filter((item): item is { label: string; value: string; cls?: string } => Boolean(item)).map(({ label, value, cls }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-slate-500">{label}</span>
              <span className={`font-semibold text-[#0B1D3A] ${cls ?? ''}`}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Shipping Section */}
      {canInputResi && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Truck size={18} className="text-[#C8960C]" />
            <h2 className="text-base font-bold text-[#0B1D3A]">Pengiriman</h2>
            {!shipment && (
              <span className="text-[10px] font-bold text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full">
                Belum ada resi
              </span>
            )}
          </div>
          <AdminOrderDetailClient
            orderId={orderId}
            orderStatus={order.status!}
            initialShipment={shipment as ShipmentData | null}
          />
        </div>
      )}
    </div>
  )
}
