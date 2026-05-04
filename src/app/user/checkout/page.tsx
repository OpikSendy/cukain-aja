/**
 * app/(user)/checkout/page.tsx — RSC
 *
 * Halaman checkout untuk pembelian langsung (fixed price).
 * Flow: Product detail → "Beli Sekarang" → Checkout → Bayar
 */
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { CheckoutButton } from '@/components/payment/CheckoutButton'
import { formatRupiah } from '@/lib/utils/format'
import { ShieldCheck, Package, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { createOrder } from '@/lib/actions/orders'
import { CheckoutAddressForm } from '@/components/payment/CheckoutAddressForm'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Checkout — Cukain Aja' }

export default async function CheckoutPage({
    searchParams,
}: {
    searchParams: Promise<{ product?: string; order?: string; step?: string }>
}) {
    const params = await searchParams
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login?next=/user/checkout')

    // ─── Mode 1: Langsung ke order yang sudah ada ─────────────────────────────
    if (params.order) {
        const { data: order } = await supabase
            .from('orders')
            .select(`
        *,
        order_items(*, products(id, title, product_images(image_url, is_primary))),
        payments(payment_status, payment_url)
      `)
            .eq('id', params.order)
            .eq('user_id', user.id)
            .single()

        if (!order || order.status !== 'pending') redirect('/user/orders')

        const items = order.order_items as {
            quantity: number; price: number
            products: { id: string; title: string; product_images: { image_url: string | null; is_primary: boolean }[] } | null
        }[]
        const firstItem = items[0]
        const image = firstItem?.products?.product_images.find(i => i.is_primary) ?? firstItem?.products?.product_images[0]

        return (
            <div className="space-y-6 max-w-lg">
                <Link href="/user/orders" className="flex items-center gap-2 text-sm text-slate-500
          hover:text-[#0B1D3A] transition-colors w-fit">
                    <ArrowLeft size={16} />Kembali
                </Link>

                <div>
                    <h1 className="text-2xl font-bold text-[#0B1D3A]">Selesaikan Pembayaran</h1>
                    <p className="text-slate-500 text-sm mt-1">Pesanan ini menunggu pembayaran kamu.</p>
                </div>

                <OrderSummary
                    title={firstItem?.products?.title ?? 'Produk'}
                    imageUrl={image?.image_url ?? null}
                    price={Number(order.total_price) - (order as any).shipping_cost}
                    quantity={firstItem?.quantity ?? 1}
                    shippingCost={(order as any).shipping_cost}
                />

                <CheckoutButton orderId={order.id} amount={Number(order.total_price)} />
            </div>
        )
    }

    // ─── Mode 2: Dari product detail — buat order baru ────────────────────────
    if (!params.product) redirect('/products')

    const adminClient = createAdminClient()
    const { data: product } = await adminClient
        .from('products')
        .select('*, product_images(*), profiles(name)')
        .eq('id', params.product)
        .in('status', ['approved', 'sold'])
        .eq('type', 'fixed')
        .single()

    if (!product) redirect('/products')

    if (product.seller_id === user.id) redirect(`/products/${product.id}`)

    const primaryImage = (product.product_images as { image_url: string | null; is_primary: boolean }[])
        .find(i => i.is_primary) ?? product.product_images[0]

    // Ambil alamat user
    const { data: profile } = await supabase
        .from('profiles')
        .select('name, phone, address, city, province, postal_code')
        .eq('id', user.id)
        .single()

    const initialAddress = profile ? {
        name: profile.name ?? '',
        phone: (profile as any).phone ?? '',
        address: (profile as any).address ?? '',
        city: (profile as any).city ?? '',
        province: (profile as any).province ?? '',
        postal_code: (profile as any).postal_code ?? ''
    } : undefined

    return (
        <div className="space-y-6 max-w-lg">
            <Link href={`/products/${product.id}`}
                className="flex items-center gap-2 text-sm text-slate-500 hover:text-[#0B1D3A] transition-colors w-fit">
                <ArrowLeft size={16} />Kembali ke Produk
            </Link>

            <div>
                <h1 className="text-2xl font-bold text-[#0B1D3A]">Detail Pengiriman</h1>
                <p className="text-slate-500 text-sm mt-1">Lengkapi alamat pengiriman untuk pesanan kamu.</p>
            </div>

            <OrderSummary
                title={product.title}
                imageUrl={primaryImage?.image_url ?? null}
                price={Number(product.price)}
                quantity={1}
                sellerName={(product.profiles as { name: string } | null)?.name}
                isVerified={product.is_verified_beacukai as boolean}
            />

            <CheckoutAddressForm productId={product.id} quantity={1} initialData={initialAddress} />

        </div>
    )
}



// ─── Order Summary Component ──────────────────────────────────────────────────

function OrderSummary({
    title, imageUrl, price, quantity,
    sellerName, isVerified, shippingCost,
}: {
    title: string; imageUrl: string | null; price: number; quantity: number
    sellerName?: string; isVerified?: boolean; shippingCost?: number
}) {
    return (
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
            <div className="flex gap-4 p-5">
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-50 shrink-0">
                    {imageUrl
                        ? <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center">
                            <Package className="text-slate-200" size={24} />
                        </div>
                    }
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#0B1D3A] leading-snug">{title}</p>
                    {sellerName && <p className="text-xs text-slate-400 mt-1">Seller: {sellerName}</p>}
                    {isVerified && (
                        <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-semibold
              text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                            <ShieldCheck size={10} />Verified Bea Cukai
                        </span>
                    )}
                </div>
            </div>

            <div className="border-t border-slate-50 px-5 py-4 space-y-2 bg-slate-50/50">
                <div className="flex justify-between text-sm text-slate-500">
                    <span>Harga Produk</span>
                    <span>{formatRupiah(price)} x {quantity}</span>
                </div>
                {shippingCost !== undefined && (
                    <div className="flex justify-between text-sm text-slate-500">
                        <span>Ongkos Kirim</span>
                        <span>{formatRupiah(shippingCost)}</span>
                    </div>
                )}
                <div className="flex justify-between font-bold text-[#0B1D3A] pt-2 border-t border-slate-100">
                    <span>Total Keseluruhan</span>
                    <span className="text-lg">{formatRupiah(price * quantity + (shippingCost ?? 0))}</span>
                </div>
            </div>
        </div>
    )
}