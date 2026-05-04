/**
 * app/(user)/orders/[id]/page.tsx — Complete with Payment + Shipping
 */
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { CheckoutButton } from '@/components/payment/CheckoutButton'
import { PaymentStatusBanner } from '@/components/payment/PaymentStatusBanner'
import { ShipmentCard } from '@/components/shipping/ShipmentCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatRupiah, formatDateTime } from '@/lib/utils/format'
import {
    ArrowLeft, Package, CreditCard, Gavel,
    CheckCircle, Clock, Truck, ShieldCheck,
} from 'lucide-react'
import type { Metadata } from 'next'
import type { ShipmentData } from '@/lib/actions/shipping'

export const metadata: Metadata = { title: 'Detail Pesanan — Cukain Aja' }

interface Props {
    params: Promise<{ id: string }>
    searchParams: Promise<{ payment?: string }>
}

export default async function OrderDetailPage(props: Props) {
    const params = await props.params
    const searchParams = await props.searchParams
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: order } = await supabase
        .from('orders')
        .select(`
      *,
      order_items(
        id, quantity, price,
        products(id, title, type, product_images(image_url, is_primary))
      ),
      payments(payment_status, payment_url, created_at, midtrans_transaction_id)
    `)
        .eq('id', params.id)
        .eq('user_id', user.id)
        .single()

    if (!order) notFound()

    // Ambil data shipment (jika sudah dikirim)
    const adminClient = createAdminClient()
    const { data: shipment } = await (adminClient as any)
        .from('shipments')
        .select('*')
        .eq('order_id', params.id)
        .single()

    type ProductType = {
        id: string; title: string; type: string
        product_images: { image_url: string | null; is_primary: boolean }[]
    }
    type ItemType = { id: string; quantity: number; price: number; products: ProductType | null }
    type PaymentType = {
        payment_status: string; payment_url: string | null
        midtrans_transaction_id: string | null
    }

    const items = order.order_items as ItemType[]
    const payment = (order.payments as PaymentType[] | null)?.[0] ?? null
    const firstItem = items[0]
    const isAuctionOrder = firstItem?.products?.type === 'auction'

    // Timeline steps
    const STATUS_STEPS = [
        { key: 'pending', label: 'Menunggu', icon: <Clock size={14} /> },
        { key: 'paid', label: 'Dibayar', icon: <CheckCircle size={14} /> },
        { key: 'shipped', label: 'Dikirim', icon: <Truck size={14} /> },
        { key: 'completed', label: 'Selesai', icon: <ShieldCheck size={14} /> },
    ]
    const currentStepIdx = STATUS_STEPS.findIndex(s => s.key === order.status)
    const isCanceled = order.status === 'canceled'

    return (
        <div className="space-y-5 max-w-xl">
            {/* Back nav */}
            <Link
                href="/user/orders"
                className="flex items-center gap-2 text-sm text-slate-500 hover:text-[#0B1D3A] transition-colors w-fit"
            >
                <ArrowLeft size={16} />
                Kembali ke Pesanan
            </Link>

            {/* Payment redirect banner */}
            {searchParams.payment && (
                <PaymentStatusBanner status={searchParams.payment} orderId={params.id} />
            )}

            {/* Header */}
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-[#0B1D3A]">Detail Pesanan</h1>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <code className="text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded font-mono">
                            #{order.id.slice(0, 8).toUpperCase()}
                        </code>
                        {isAuctionOrder && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-[#C8960C]
                bg-[#C8960C]/10 border border-[#C8960C]/20 px-2 py-0.5 rounded-full">
                                <Gavel size={9} />
                                Pesanan Lelang
                            </span>
                        )}
                    </div>
                </div>
                <StatusBadge status={order.status!} />
            </div>

            {/* Progress timeline */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5">
                <div className="flex items-center">
                    {STATUS_STEPS.map((step, i) => {
                        const isDone = !isCanceled && i <= currentStepIdx
                        const isCurrent = !isCanceled && i === currentStepIdx

                        return (
                            <div key={step.key} className="flex items-center flex-1">
                                <div className="flex flex-col items-center gap-1.5">
                                    {/* Circle */}
                                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center
                    transition-all ${isCanceled ? 'border-red-200 bg-red-50 text-red-400'
                                            : isDone && !isCurrent ? 'bg-[#0B1D3A] border-[#0B1D3A] text-white'
                                                : isCurrent ? 'bg-[#C8960C] border-[#C8960C] text-white'
                                                    : 'border-slate-200 bg-white text-slate-300'
                                        }`}>
                                        {isCanceled ? '✕' : isDone && !isCurrent ? <CheckCircle size={14} /> : step.icon}
                                    </div>
                                    {/* Label */}
                                    <span className={`text-[10px] font-semibold text-center whitespace-nowrap ${isCurrent ? 'text-[#C8960C]'
                                        : isDone ? 'text-[#0B1D3A]'
                                            : 'text-slate-300'
                                        }`}>
                                        {step.label}
                                    </span>
                                </div>

                                {/* Connector */}
                                {i < STATUS_STEPS.length - 1 && (
                                    <div className={`flex-1 h-0.5 mx-1.5 mb-5 rounded transition-colors ${!isCanceled && i < currentStepIdx ? 'bg-[#0B1D3A]' : 'bg-slate-100'
                                        }`} />
                                )}
                            </div>
                        )
                    })}
                </div>

                {isCanceled && (
                    <p className="text-center text-xs text-red-500 font-medium mt-3">
                        Pesanan ini telah dibatalkan
                    </p>
                )}
            </div>

            {/* Product items */}
            <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-[#0B1D3A]">
                        Produk ({items.length})
                    </h2>
                </div>

                <div className="divide-y divide-slate-50">
                    {items.map((item) => {
                        const img = item.products?.product_images?.find(i => i.is_primary)
                            ?? item.products?.product_images?.[0]

                        return (
                            <div key={item.id} className="flex items-center gap-4 px-5 py-4">
                                {/* Thumbnail */}
                                <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-50 shrink-0">
                                    {img?.image_url ? (
                                        <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Package className="text-slate-200" size={18} />
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <Link
                                        href={`/products/${item.products?.id}`}
                                        className="text-sm font-medium text-[#0B1D3A] hover:text-[#C8960C]
                      transition-colors truncate block"
                                    >
                                        {item.products?.title ?? 'Produk'}
                                    </Link>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        {item.quantity}× &nbsp;·&nbsp; {formatRupiah(item.price)}
                                    </p>
                                </div>

                                {/* Subtotal */}
                                <p className="text-sm font-bold text-[#0B1D3A] shrink-0">
                                    {formatRupiah(item.price * item.quantity)}
                                </p>
                            </div>
                        )
                    })}
                </div>

                {/* Total row */}
                <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/60
          flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-600">Total</span>
                    <span className="text-xl font-black text-[#0B1D3A]">
                        {formatRupiah(order.total_price)}
                    </span>
                </div>
            </div>

            {/* Payment card */}
            <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-50">
                    <CreditCard size={17} className="text-slate-400" />
                    <h2 className="text-sm font-semibold text-[#0B1D3A]">Pembayaran</h2>
                </div>

                <div className="px-5 py-4 space-y-2.5">
                    {[
                        { label: 'Metode', value: order.payment_method?.toUpperCase() ?? 'MIDTRANS' },
                        {
                            label: 'Status',
                            value: payment
                                ? payment.payment_status === 'settlement' ? 'Lunas ✓'
                                    : payment.payment_status === 'pending' ? 'Menunggu'
                                        : payment.payment_status
                                : 'Belum Dibayar',
                            valueClass:
                                payment?.payment_status === 'settlement' ? 'text-green-600'
                                    : payment?.payment_status === 'pending' ? 'text-amber-600'
                                        : 'text-slate-600',
                        },
                        { label: 'Tanggal Order', value: formatDateTime(order.created_at) },
                    ].map(({ label, value, valueClass }) => (
                        <div key={label} className="flex items-center justify-between text-sm">
                            <span className="text-slate-500">{label}</span>
                            <span className={`font-semibold text-[#0B1D3A] ${valueClass ?? ''}`}>
                                {value}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Pay now — hanya jika pending */}
                {order.status === 'pending' && (
                    <div className="px-5 pb-5">
                        <CheckoutButton
                            orderId={order.id}
                            amount={Number(order.total_price)}
                            className="w-full py-3.5"
                        />
                        <p className="text-center text-[11px] text-slate-400 mt-2">
                            Pesanan akan kadaluarsa dalam 24 jam jika tidak dibayar
                        </p>
                    </div>
                )}
            </div>

            {/* Shipping card — tampil setelah paid */}
            {shipment && (
                <ShipmentCard
                    shipment={shipment as ShipmentData}
                    orderId={order.id}
                    orderStatus={order.status!}
                />
            )}

            {/* Hint tracking publik */}
            {shipment && (
                <div className="bg-[#0B1D3A]/3 border border-[#0B1D3A]/10 rounded-2xl px-5 py-3.5
                    flex items-center justify-between gap-3">
                    <div>
                        <p className="text-xs font-semibold text-[#0B1D3A]">Lacak paket dari mana saja</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                            Gunakan nomor resi <code className="font-mono text-[#0B1D3A]">{shipment.internal_tracking_id}</code>
                        </p>
                    </div>
                    <a
                        href={`/track?id=${shipment.internal_tracking_id}`}
                        target="_blank"
                        className="shrink-0 px-4 py-2 bg-[#0B1D3A] text-white text-xs font-bold
                            rounded-xl hover:bg-[#1a3a6e] transition-colors"
                    >
                        Lacak Paket
                    </a>
                </div>
            )}
        </div>
    )
}