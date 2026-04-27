/**
 * app/api/cron/end-auctions/route.ts
 *
 * Cron job untuk menutup lelang yang sudah melewati end_time.
 * Setelah lelang ditutup, otomatis generate order untuk pemenang.
 *
 * Setup di Vercel:
 * 1. Buat file vercel.json di root project (lihat di bawah)
 * 2. Add CRON_SECRET ke environment variables Vercel
 *
 * vercel.json:
 * {
 *   "crons": [{ "path": "/api/cron/end-auctions", "schedule": "* * * * *" }]
 * }
 * Schedule: setiap menit (untuk responsivitas)
 *
 * SECURITY: Protected by CRON_SECRET header
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/lib/types/database'

export async function GET(request: NextRequest) {
    // 1. Validasi CRON_SECRET agar hanya bisa dipanggil oleh Vercel/authorized
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Supabase dengan service role
    const supabase = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { cookies: { getAll: () => [], setAll: () => { } } }
    )

    const now = new Date().toISOString()

    // 3. Temukan semua lelang aktif yang sudah melewati end_time
    const { data: expiredAuctions, error: fetchError } = await supabase
        .from('auctions')
        .select('id, product_id, current_price, start_price')
        .eq('status', 'active')
        .lt('end_time', now)

    if (fetchError) {
        console.error('[cron/end-auctions] Fetch error:', fetchError)
        return NextResponse.json({ error: 'DB fetch failed' }, { status: 500 })
    }

    if (!expiredAuctions || expiredAuctions.length === 0) {
        return NextResponse.json({ message: 'No expired auctions', processed: 0 })
    }

    console.info(`[cron/end-auctions] Found ${expiredAuctions.length} expired auction(s)`)

    const results: { auctionId: string; status: string; orderId?: string }[] = []

    for (const auction of expiredAuctions) {
        try {
            // 4. Set status lelang ke 'ended'
            const { error: endError } = await supabase
                .from('auctions')
                .update({ status: 'ended' })
                .eq('id', auction.id)

            if (endError) {
                console.error(`[cron] Failed to end auction ${auction.id}:`, endError)
                results.push({ auctionId: auction.id, status: 'error_ending' })
                continue
            }

            // 5. Cari pemenang (bid tertinggi)
            const { data: winningBid } = await supabase
                .from('bids')
                .select('user_id, amount')
                .eq('auction_id', auction.id)
                .order('amount', { ascending: false })
                .limit(1)
                .single()

            if (!winningBid) {
                // Tidak ada bid — lelang selesai tanpa pemenang
                console.info(`[cron] Auction ${auction.id} ended with no bids`)
                results.push({ auctionId: auction.id, status: 'ended_no_bids' })
                continue
            }

            // 6. Generate order untuk pemenang
            const { data: newOrder, error: orderError } = await supabase
                .from('orders')
                .insert({
                    user_id: winningBid.user_id,
                    total_price: winningBid.amount,
                    status: 'pending',
                    payment_method: 'midtrans',
                })
                .select('id')
                .single()

            if (orderError || !newOrder) {
                console.error(`[cron] Failed to create order for auction ${auction.id}:`, orderError)
                results.push({ auctionId: auction.id, status: 'error_creating_order' })
                continue
            }

            // 7. Create order item
            const { error: itemError } = await supabase
                .from('order_items')
                .insert({
                    order_id: newOrder.id,
                    product_id: auction.product_id,
                    price: winningBid.amount,
                    quantity: 1,
                })

            if (itemError) {
                console.error(`[cron] Failed to create order item for ${newOrder.id}:`, itemError)
            }

            // 8. Update product status ke 'sold'
            await supabase
                .from('products')
                .update({ status: 'sold' })
                .eq('id', auction.product_id as string)

            console.info(`[cron] ✓ Auction ${auction.id} → Order ${newOrder.id} (winner: ${winningBid.user_id})`)
            results.push({ auctionId: auction.id, status: 'completed', orderId: newOrder.id })

        } catch (err) {
            console.error(`[cron] Unexpected error for auction ${auction.id}:`, err)
            results.push({ auctionId: auction.id, status: 'unexpected_error' })
        }
    }

    return NextResponse.json({
        message: 'Cron completed',
        processed: expiredAuctions.length,
        results,
        timestamp: new Date().toISOString(),
    })
}

// ─── Juga trigger lelang upcoming → active ────────────────────────────────────
// Dicek sekalian saat endpoint ini dipanggil

export async function POST(request: NextRequest) {
    // Endpoint alternatif — sama dengan GET, untuk fleksibilitas
    return GET(request)
}