/**
 * lib/actions/orders.ts
 *
 * Server Actions untuk order management.
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { isValidUUID } from '@/lib/utils/validators'
import type { ActionResult, Order, OrderWithItems, CreateOrderInput } from '@/lib/types'

// ─── User Actions ─────────────────────────────────────────────────────────────

/** Buat order baru (pembelian langsung) */
export async function createOrder(input: CreateOrderInput): Promise<ActionResult<{ orderId: string; paymentUrl: string | null }>> {
  if (!isValidUUID(input.productId)) return { data: null, error: 'ID produk tidak valid' }

  const quantity = input.quantity ?? 1
  if (quantity < 1 || quantity > 100) return { data: null, error: 'Jumlah tidak valid' }

  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { data: null, error: 'Login dulu untuk membeli' }

  // Ambil data produk
  const { data: product } = await supabase
    .from('products')
    .select('id, title, price, status, type, seller_id')
    .eq('id', input.productId)
    .single()

  if (!product) return { data: null, error: 'Produk tidak ditemukan' }
  if (product.status !== 'approved') return { data: null, error: 'Produk belum tersedia' }
  if (product.type !== 'fixed') return { data: null, error: 'Produk ini hanya bisa dibeli via lelang' }
  if (product.seller_id === user.id) return { data: null, error: 'Tidak bisa membeli produk sendiri' }
  if (!product.price) return { data: null, error: 'Harga produk tidak valid' }

  const totalPrice = product.price * quantity

  // Create order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: user.id,
      total_price: totalPrice,
      status: 'pending',
      payment_method: 'midtrans',
    })
    .select()
    .single()

  if (orderError) return { data: null, error: 'Gagal membuat order' }

  // Create order item
  const { error: itemError } = await supabase
    .from('order_items')
    .insert({
      order_id: order.id,
      product_id: product.id,
      price: product.price,
      quantity,
    })

  if (itemError) {
    // Rollback order (best effort)
    await supabase.from('orders').delete().eq('id', order.id)
    return { data: null, error: 'Gagal membuat order item' }
  }

  // TODO: Generate Midtrans payment URL (Phase 5)
  // const { data: payment } = await createMidtransTransaction(order.id, totalPrice, user)

  return {
    data: {
      orderId: order.id,
      paymentUrl: null, // akan diisi setelah Phase 5
    },
    error: null,
  }
}

/** Ambil semua order milik user yang login */
export async function getMyOrders(): Promise<ActionResult<OrderWithItems[]>> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { data: null, error: 'Unauthorized' }

  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items(
        *,
        products(id, title)
      ),
      payments(payment_status, payment_url)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return { data: null, error: 'Gagal mengambil data order' }

  return { data: (data as OrderWithItems[]) ?? [], error: null }
}

/** Ambil detail order */
export async function getOrderDetail(orderId: string): Promise<ActionResult<OrderWithItems>> {
  if (!isValidUUID(orderId)) return { data: null, error: 'ID tidak valid' }

  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { data: null, error: 'Unauthorized' }

  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items(
        *,
        products(id, title)
      ),
      payments(payment_status, payment_url)
    `)
    .eq('id', orderId)
    .eq('user_id', user.id) // owner check
    .single()

  if (error) return { data: null, error: 'Order tidak ditemukan' }

  return { data: data as OrderWithItems, error: null }
}

/** Cancel order (hanya yang masih pending) */
export async function cancelOrder(orderId: string): Promise<ActionResult> {
  if (!isValidUUID(orderId)) return { data: null, error: 'ID tidak valid' }

  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { data: null, error: 'Unauthorized' }

  const { data: order } = await supabase
    .from('orders')
    .select('status')
    .eq('id', orderId)
    .eq('user_id', user.id)
    .single()

  if (!order) return { data: null, error: 'Order tidak ditemukan' }
  if (order.status !== 'pending') {
    return { data: null, error: 'Hanya order yang belum dibayar yang bisa dibatalkan' }
  }

  const { error } = await supabase
    .from('orders')
    .update({ status: 'canceled' })
    .eq('id', orderId)
    .eq('user_id', user.id)

  if (error) return { data: null, error: 'Gagal membatalkan order' }

  return { data: null, error: null }
}

// ─── Admin Actions ────────────────────────────────────────────────────────────

/** Ambil semua order untuk admin */
export async function getAllOrders(status?: string): Promise<ActionResult<OrderWithItems[]>> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { data: null, error: 'Unauthorized' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') return { data: null, error: 'Forbidden' }

  let query = supabase
    .from('orders')
    .select(`
      *,
      order_items(*, products(id, title)),
      payments(payment_status, payment_url)
    `)
    .order('created_at', { ascending: false })

  if (status) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query = query.eq('status', status as any)
  }

  const { data, error } = await query

  if (error) return { data: null, error: 'Gagal mengambil data order' }

  return { data: (data as OrderWithItems[]) ?? [], error: null }
}

/** Update status order (admin: ship, complete) */
export async function updateOrderStatus(
  orderId: string,
  status: 'shipped' | 'completed'
): Promise<ActionResult<Order>> {
  if (!isValidUUID(orderId)) return { data: null, error: 'ID tidak valid' }

  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { data: null, error: 'Unauthorized' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') return { data: null, error: 'Forbidden' }

  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)
    .select()
    .single()

  if (error) return { data: null, error: 'Gagal update status order' }

  return { data, error: null }
}