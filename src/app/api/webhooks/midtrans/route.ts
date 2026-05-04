/**
 * app/api/webhooks/midtrans/route.ts
 *
 * Webhook handler untuk notifikasi pembayaran dari Midtrans.
 *
 * SECURITY:
 * 1. Verifikasi signature WAJIB sebelum proses apapun
 * 2. Double-check status via Core API (opsional tapi direkomendasikan)
 * 3. Idempotent — handle duplicate notifications dengan aman
 *
 * Midtrans mengirim POST ke endpoint ini untuk setiap perubahan status transaksi.
 * Setup di Midtrans Dashboard: Settings → Configuration → Payment Notification URL
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import {
    verifyWebhookSignature,
    mapMidtransStatus,
    type MidtransNotification,
} from '@/lib/services/midtrans'
import type { Database } from '@/lib/types/database'

export async function POST(request: NextRequest) {
    let body: MidtransNotification

    // 1. Parse body
    try {
        body = await request.json()
    } catch {
        console.error('[webhook/midtrans] Invalid JSON body')
        return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
    }

    // 2. Validasi signature — WAJIB, jangan skip
    // Catatan: Payload test dari dashboard Midtrans memiliki signature yang tidak valid,
    // jadi kita bypass khusus untuk order_id yang berawalan 'payment_notif_test_'
    if (body.order_id?.startsWith('payment_notif_test_')) {
        console.info('[webhook/midtrans] Test notification received, ignoring signature')
        return NextResponse.json({ message: 'Test notification OK' })
    }

    const isValid = await verifyWebhookSignature(body)
    if (!isValid) {
        console.error('[webhook/midtrans] Invalid signature for order:', body.order_id)
        return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
    }

    // 3. Setup Supabase dengan service role untuk bypass RLS
    // Webhook tidak punya user session, jadi perlu service role
    const supabase = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role — server only
        {
            cookies: {
                // Webhook tidak punya cookies
                getAll: () => [],
                setAll: () => { },
            },
        }
    )

    const orderId = body.order_id
    const internalStatus = mapMidtransStatus(body.transaction_status, body.fraud_status)

    console.info('[webhook/midtrans] Processing notification:', {
        orderId,
        transactionStatus: body.transaction_status,
        internalStatus,
        paymentType: body.payment_type,
    })

    try {
        // 4. Ambil order untuk verifikasi keberadaan
        const { data: order } = await supabase
            .from('orders')
            .select('id, status, total_price')
            .eq('id', orderId)
            .single()

        if (!order) {
            console.error('[webhook/midtrans] Order not found:', orderId)
            // Return 200 agar Midtrans tidak retry — order memang tidak ada
            return NextResponse.json({ message: 'Order not found, ignoring' })
        }

        // 5. Idempotency — skip kalau status sudah final
        const finalStatuses = ['paid', 'completed', 'canceled']
        if (finalStatuses.includes(order.status!) && internalStatus !== 'paid') {
            console.info('[webhook/midtrans] Order already in final state, skipping:', orderId)
            return NextResponse.json({ message: 'Already processed' })
        }

        // 6. Update order status
        const orderStatus =
            internalStatus === 'paid' ? 'paid'
                : internalStatus === 'canceled' ? 'canceled'
                    : null // pending/failed — jangan ubah order status

        if (orderStatus) {
            const { error: orderError } = await supabase
                .from('orders')
                .update({ status: orderStatus })
                .eq('id', orderId)

            if (orderError) {
                console.error('[webhook/midtrans] Failed to update order:', orderError)
                return NextResponse.json({ error: 'DB update failed' }, { status: 500 })
            }
        }

        // 7. Update / insert payment record
        const { error: paymentError } = await supabase
            .from('payments')
            .upsert({
                order_id: orderId,
                midtrans_transaction_id: body.transaction_id,
                payment_status: body.transaction_status,
                // Gunakan casting ke Json (dari tipe database) 
                // agar TypeScript tidak komplain Record vs Json
                raw_response: body as any,
            }, {
                onConflict: 'order_id'
            })

        if (paymentError) {
            console.error('[webhook/midtrans] Failed to update payment:', paymentError)
        }

        // 8. Post-payment actions
        if (internalStatus === 'paid') {
            // Mark produk sebagai sold (untuk fixed price — 1 produk per order)
            const { data: orderItems } = await supabase
                .from('order_items')
                .select('product_id, products(type)')
                .eq('order_id', orderId)

            for (const item of orderItems ?? []) {
                const product = item.products as { type: string } | null
                if (product?.type === 'fixed') {
                    await supabase
                        .from('products')
                        .update({ status: 'sold' })
                        .eq('id', item.product_id as string)
                }
            }

            console.info('[webhook/midtrans] ✓ Payment confirmed for order:', orderId)
        }

        return NextResponse.json({ message: 'OK', orderId, status: internalStatus })
    } catch (err) {
        console.error('[webhook/midtrans] Unexpected error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// Midtrans juga kadang kirim GET — respond 200 saja
export async function GET() {
    return NextResponse.json({ message: 'Midtrans webhook endpoint active' })
}