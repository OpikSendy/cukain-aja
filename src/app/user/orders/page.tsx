/**
 * app/(user)/orders/page.tsx — RSC
 */
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { formatRupiah, formatDateTime } from '@/lib/utils/format'
import { ShoppingBag, ArrowRight } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Pesanan Saya — Cukain Aja' }

export default async function UserOrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: orders } = await supabase
    .from('orders')
    .select(`
      *,
      order_items(quantity, price, products(id, title, product_images(image_url, is_primary))),
      payments(payment_status)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#0B1D3A]">Pesanan Saya</h1>

      {!orders || orders.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl">
          <EmptyState
            icon={<ShoppingBag size={28} />}
            title="Belum ada pesanan"
            description="Temukan produk bea cukai pilihan kamu dan mulai berbelanja."
            action={
              <Link href="/products"
                className="px-5 py-2.5 bg-[#0B1D3A] text-white rounded-xl text-sm
                  font-semibold hover:bg-[#0B1D3A]/90 transition-colors">
                Jelajahi Produk
              </Link>
            }
          />
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const items = order.order_items as {
              quantity: number; price: number;
              products: { id: string; title: string; product_images: { image_url: string | null; is_primary: boolean }[] } | null
            }[]
            const firstItem = items[0]
            const primaryImage = firstItem?.products?.product_images?.find(i => i.is_primary)
              ?? firstItem?.products?.product_images?.[0]
            const moreCount = items.length - 1

            return (
              <Link
                key={order.id}
                href={`/user/orders/${order.id}`}
                className="block bg-white border border-slate-100 rounded-2xl overflow-hidden
                  hover:border-slate-200 hover:shadow-sm transition-all"
              >
                {/* Order header */}
                <div className="flex items-center justify-between px-5 py-3
                  border-b border-slate-50 bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 font-mono">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </span>
                    <span className="text-slate-200">·</span>
                    <span className="text-xs text-slate-400">
                      {formatDateTime(order.created_at)}
                    </span>
                  </div>
                  <StatusBadge status={order.status!} size="sm" />
                </div>

                {/* Order items preview */}
                <div className="flex items-center gap-4 px-5 py-4">
                  {/* Thumbnail */}
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-50 shrink-0">
                    {primaryImage?.image_url ? (
                      <img src={primaryImage.image_url} alt=""
                        className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="text-slate-200" size={20} />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#0B1D3A] truncate">
                      {firstItem?.products?.title ?? 'Produk'}
                    </p>
                    {moreCount > 0 && (
                      <p className="text-xs text-slate-400 mt-0.5">+{moreCount} produk lainnya</p>
                    )}
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="font-bold text-[#0B1D3A]">{formatRupiah(order.total_price)}</p>
                    <div className="flex items-center gap-1 mt-1 justify-end">
                      <span className="text-xs text-slate-400">Detail</span>
                      <ArrowRight size={12} className="text-slate-400" />
                    </div>
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