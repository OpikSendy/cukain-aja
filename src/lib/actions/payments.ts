/**
 * lib/actions/payments.ts — Complete
 *
 * Server Actions untuk payment:
 * - Initiate Midtrans Snap (dapat token)
 * - Verify payment dari client callback
 * - Update order status pasca pembayaran
 */
'use server'

import { createClient } from '@/lib/supabase/server'
import { createSnapToken, getTransactionStatus, mapMidtransStatus } from '@/lib/services/midtrans'
import { isValidUUID } from '@/lib/utils/validators'
import type { ActionResult } from '@/lib/types'

// ─── Initiate Payment ─────────────────────────────────────────────────────────

export interface InitiatePaymentResult {
  snapToken: string
  snapUrl: string
  clientKey: string
  orderId: string
}

export async function initiatePayment(
  orderId: string
): Promise<ActionResult<InitiatePaymentResult>> {
  if (!isValidUUID(orderId)) return { data: null, error: 'ID order tidak valid' }

  const supabase = await createClient()

  // Auth check
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { data: null, error: 'Silakan login terlebih dahulu' }

  // Ambil order + items + user profile
  const { data: order } = await supabase
    .from('orders')
    .select(`
      *,
      order_items(quantity, price, products(id, title)),
      payments(id, payment_status)
    `)
    .eq('id', orderId)
    .eq('user_id', user.id)
    .single()

  if (!order) return { data: null, error: 'Order tidak ditemukan' }

  // Cek status order
  if (order.status !== 'pending') {
    if (order.status === 'paid') return { data: null, error: 'Order ini sudah dibayar' }
    if (order.status === 'canceled') return { data: null, error: 'Order ini sudah dibatalkan' }
    return { data: null, error: 'Order tidak bisa dibayar saat ini' }
  }

  // Cek apakah sudah ada payment yang belum selesai
  const existingPayment = (order.payments as { id: string; payment_status: string }[])?.[0]
  if (existingPayment?.payment_status === 'pending') {
    // Gunakan payment URL yang sudah ada kalau masih pending
    const { data: paymentData } = await supabase
      .from('payments')
      .select('payment_url, midtrans_transaction_id')
      .eq('id', existingPayment.id)
      .single()

    if (paymentData?.midtrans_transaction_id) {
      // Re-generate snap token dari transaction yang sama tidak dimungkinkan
      // Kita buat payment baru (old one akan expire)
    }
  }

  // Ambil profile user untuk customer data
  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .single()

  // Build items untuk Midtrans
  const items = (order.order_items as {
    quantity: number; price: number
    products: { id: string; title: string } | null
  }[]).map((item) => ({
    id: item.products?.id ?? orderId,
    name: item.products?.title ?? 'Produk Bea Cukai',
    price: Number(item.price),
    quantity: item.quantity,
    category: 'Bea Cukai',
    merchant_name: 'Cukain Aja',
  }))

  // Create Snap token
  const snapResult = await createSnapToken({
    orderId,
    amount: Number(order.total_price),
    customer: {
      id: user.id,
      name: profile?.name ?? 'Customer',
      email: user.email ?? '',
    },
    items,
  })

  if (snapResult.error || !snapResult.data) {
    return { data: null, error: snapResult.error ?? 'Gagal membuat token pembayaran' }
  }

  // Simpan payment record ke DB
  const { error: paymentError } = await supabase
    .from('payments')
    .upsert({
      order_id: orderId,
      payment_status: 'pending',
      payment_url: snapResult.data.redirectUrl,
      midtrans_transaction_id: null, // akan diisi oleh webhook
      raw_response: { snap_token: snapResult.data.token },
    }, { onConflict: 'order_id' })

  if (paymentError) {
    console.error('[payments/initiate] Failed to save payment record:', paymentError)
  }

  return {
    data: {
      snapToken: snapResult.data.token,
      snapUrl: snapResult.data.redirectUrl,
      clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? '',
      orderId,
    },
    error: null,
  }
}

// ─── Verify Payment (Client Callback) ────────────────────────────────────────

/**
 * Dipanggil setelah user selesai di Midtrans Snap popup.
 * Midtrans callback hanya memberi tahu "sudah selesai", status sebenarnya
 * dikonfirmasi via Core API atau ditunggu dari webhook.
 */
export async function verifyPayment(
  orderId: string
): Promise<ActionResult<{ status: string; message: string }>> {
  if (!isValidUUID(orderId)) return { data: null, error: 'ID tidak valid' }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Unauthorized' }

  // Cek status dari Midtrans Core API
  const statusResult = await getTransactionStatus(orderId)

  if (statusResult.error || !statusResult.data) {
    // Kalau gagal cek, kembalikan status order dari DB
    const { data: order } = await supabase
      .from('orders')
      .select('status')
      .eq('id', orderId)
      .single()

    return {
      data: {
        status: order?.status ?? 'pending',
        message: 'Status sedang diverifikasi...',
      },
      error: null,
    }
  }

  const internalStatus = mapMidtransStatus(
    statusResult.data.transactionStatus,
    statusResult.data.fraudStatus
  )

  // Update DB jika status berubah
  if (internalStatus === 'paid') {
    await supabase
      .from('orders')
      .update({ status: 'paid' })
      .eq('id', orderId)
      .eq('user_id', user.id)

    await supabase
      .from('payments')
      .update({
        payment_status: 'settlement',
        midtrans_transaction_id: statusResult.data.paymentType,
        raw_response: statusResult.data,
      })
      .eq('order_id', orderId)
  }

  const messages: Record<string, string> = {
    paid: 'Pembayaran berhasil! Terima kasih.',
    pending: 'Pembayaran sedang diproses. Kami akan update segera.',
    canceled: 'Pembayaran dibatalkan atau kadaluarsa.',
    failed: 'Pembayaran gagal. Silakan coba lagi.',
  }

  return {
    data: {
      status: internalStatus,
      message: messages[internalStatus] ?? 'Status tidak diketahui',
    },
    error: null,
  }
}

// ─── Admin: Manual Update Payment Status ─────────────────────────────────────

export async function adminUpdatePaymentStatus(
  orderId: string,
  status: 'paid' | 'canceled'
): Promise<ActionResult> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Unauthorized' }

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { data: null, error: 'Forbidden' }

  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)

  if (error) return { data: null, error: 'Gagal update status' }

  return { data: null, error: null }
}