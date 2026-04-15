/**
 * app/(user)/orders/[id]/page.tsx — RSC
 */
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatRupiah, formatDateTime, ORDER_STATUS_LABEL } from '@/lib/utils/format'
import { ArrowLeft, Package, CreditCard, MapPin, Copy } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Detail Pesanan — Cukain Aja' }

type Payment = {
    payment_status: string | null
    payment_url: string | null
    created_at: string | null
}


export default async function OrderDetailPage({ params }: { params: { id: string } }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: order } = await supabase
        .from('orders')
        .select(`
      *,
      order_items(*, products(id, title, product_images(image_url, is_primary))),
      payments(payment_status, payment_url, created_at)
    `)
        .eq('id', params.id)
        .eq('user_id', user.id)
        .single()

    if (!order) notFound()

    const items = order.order_items as {
        id: string; quantity: number; price: number;
        products: { id: string; title: string; product_images: { image_url: string | null; is_primary: boolean }[] } | null
    }[]

    const payment: Payment | null = order.payments?.[0] ?? null

    return (
        <div className="space-y-6">
            {/* Back */}
            <Link href="/user/orders"
                className="flex items-center gap-2 text-sm text-slate-500 hover:text-[#0B1D3A] transition-colors w-fit">
                <ArrowLeft size={16} />
                Kembali ke Pesanan
            </Link>

            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-xl font-bold text-[#0B1D3A]">Detail Pesanan</h1>
                    <p className="text-xs text-slate-400 font-mono mt-1">#{order.id.toUpperCase()}</p>
                </div>
                <StatusBadge status={order.status!} />
            </div>

            {/* Timeline */}
            <div className="bg-white border border-slate-100 rounded-2xl px-6 py-5">
                <h2 className="text-sm font-semibold text-slate-700 mb-4">Status Pesanan</h2>
                <div className="flex items-center gap-0">
                    {['pending', 'paid', 'shipped', 'completed'].map((s, i) => {
                        const statusOrder = ['pending', 'paid', 'shipped', 'completed']
                        const currentIdx = statusOrder.indexOf(order.status!)
                        const isDone = i <= currentIdx && order.status !== 'canceled'

                        return (
                            <div key={s} className="flex items-center flex-1">
                                <div className="flex flex-col items-center">
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[9px] font-bold
                    ${isDone
                                            ? 'bg-[#0B1D3A] border-[#0B1D3A] text-white'
                                            : 'border-slate-200 text-slate-300'}`}>
                                        {isDone ? '✓' : i + 1}
                                    </div>
                                    <span className={`text-[9px] mt-1 font-medium capitalize
                    ${isDone ? 'text-[#0B1D3A]' : 'text-slate-300'}`}>
                                        {ORDER_STATUS_LABEL[s]?.split(' ')[0] ?? s}
                                    </span>
                                </div>
                                {i < 3 && (
                                    <div className={`flex-1 h-0.5 mx-1 mb-3.5 ${i < currentIdx && isDone ? 'bg-[#0B1D3A]' : 'bg-slate-100'}`} />
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Items */}
            <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-50">
                    <h2 className="text-sm font-semibold text-slate-700">Produk ({items.length})</h2>
                </div>
                <div className="divide-y divide-slate-50">
                    {items.map((item) => {
                        const image = item.products?.product_images?.find(i => i.is_primary) ?? item.products?.product_images?.[0]
                        return (
                            <div key={item.id} className="flex items-center gap-4 px-6 py-4">
                                <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-50 shrink-0">
                                    {image?.image_url
                                        ? <img src={image.image_url} alt="" className="w-full h-full object-cover" />
                                        : <div className="w-full h-full flex items-center justify-center">
                                            <Package className="text-slate-200" size={18} />
                                        </div>
                                    }
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-[#0B1D3A] truncate">{item.products?.title}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        {item.quantity}x · {formatRupiah(item.price)}
                                    </p>
                                </div>
                                <p className="text-sm font-semibold text-[#0B1D3A] shrink-0">
                                    {formatRupiah(item.price * item.quantity)}
                                </p>
                            </div>
                        )
                    })}
                </div>

                {/* Total */}
                <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <span className="text-sm font-semibold text-slate-700">Total</span>
                    <span className="text-lg font-bold text-[#0B1D3A]">{formatRupiah(order.total_price)}</span>
                </div>
            </div>

            {/* Payment */}
            <div className="bg-white border border-slate-100 rounded-2xl px-6 py-5">
                <div className="flex items-center gap-2 mb-4">
                    <CreditCard size={17} className="text-slate-400" />
                    <h2 className="text-sm font-semibold text-slate-700">Pembayaran</h2>
                </div>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-slate-500">Metode</span>
                        <span className="font-medium text-[#0B1D3A] capitalize">{order.payment_method}</span>
                    </div>
                    {payment && (
                        <div className="flex justify-between">
                            <span className="text-slate-500">Status Pembayaran</span>
                            <span className={`font-medium ${payment.payment_status === 'settlement' ? 'text-green-600' : 'text-amber-600'}`}>
                                {payment.payment_status === 'settlement' ? 'Lunas' : payment.payment_status}
                            </span>
                        </div>
                    )}
                    <div className="flex justify-between">
                        <span className="text-slate-500">Tanggal Pesan</span>
                        <span className="font-medium text-[#0B1D3A]">{formatDateTime(order.created_at)}</span>
                    </div>
                </div>

                {/* Pay now button */}
                {order.status === 'pending' && payment?.payment_url && (
                    <a
                        href={payment.payment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full mt-4 py-3.5 bg-[#C8960C] text-[#0B1D3A] rounded-xl
              font-bold text-center text-sm hover:bg-[#C8960C]/90 transition-colors"
                    >
                        Bayar Sekarang
                    </a>
                )}
            </div>
        </div>
    )
}