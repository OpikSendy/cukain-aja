/**
 * lib/actions/shipping.ts
 *
 * Server Actions untuk sistem pengiriman Cukain Aja.
 * - Admin: input resi, update status pengiriman
 * - User: lihat info pengiriman, konfirmasi penerimaan
 * - Public: cek resi via internal tracking ID
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateInternalTrackingId, isValidTrackingId } from '@/lib/utils/tracking'
import { isValidUUID } from '@/lib/utils/validators'
import type { ActionResult } from '@/lib/types'
import type { CourierType } from '@/constants/config'
import type { ShipmentStatus } from '@/lib/utils/tracking'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ShipmentData {
  id: string
  order_id: string
  courier: CourierType
  tracking_number: string
  internal_tracking_id: string
  status: ShipmentStatus
  estimated_delivery: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface ShipmentWithOrder extends ShipmentData {
  orders: {
    id: string
    total_price: number | null
    user_id: string | null
    order_items: {
      quantity: number
      price: number
      products: { id: string; title: string } | null
    }[]
    profiles: { name: string | null; email: string | null } | null
  } | null
}

// ─── Admin: Buat Shipment (Input Resi) ────────────────────────────────────────

export async function createShipment(params: {
  orderId: string
  courier: CourierType
  trackingNumber: string
  estimatedDelivery?: string
  notes?: string
}): Promise<ActionResult<ShipmentData>> {
  if (!isValidUUID(params.orderId)) return { data: null, error: 'ID order tidak valid' }
  if (!params.trackingNumber.trim()) return { data: null, error: 'Nomor resi tidak boleh kosong' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Unauthorized' }

  // Verifikasi admin
  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { data: null, error: 'Hanya admin yang bisa input resi' }

  // Verifikasi order ada dan sudah paid
  const adminClient = createAdminClient()
  const { data: order } = await adminClient
    .from('orders')
    .select('id, status')
    .eq('id', params.orderId)
    .single()

  if (!order) return { data: null, error: 'Order tidak ditemukan' }
  if (order.status !== 'paid') {
    return { data: null, error: `Order harus berstatus "paid" untuk diinput resi (saat ini: ${order.status})` }
  }

  // Cek duplikat — kalau sudah ada shipment, update saja
  const { data: existing } = await (adminClient as any)
    .from('shipments')
    .select('id')
    .eq('order_id', params.orderId)
    .single()

  if (existing) {
    return { data: null, error: 'Order ini sudah memiliki data pengiriman. Gunakan updateShipmentStatus untuk update.' }
  }

  // Generate internal tracking ID unik
  let internalId = generateInternalTrackingId()
  // Pastikan tidak duplikat (sangat jarang tapi aman)
  const { data: dup } = await (adminClient as any)
    .from('shipments')
    .select('id')
    .eq('internal_tracking_id', internalId)
    .single()
  if (dup) internalId = generateInternalTrackingId() // re-roll sekali

  // Hitung estimasi tiba jika tidak di-input
  const estimatedDelivery = params.estimatedDelivery ?? (() => {
    const d = new Date()
    d.setDate(d.getDate() + 3)
    return d.toISOString().split('T')[0]
  })()

  // Insert shipment
  const { data: shipment, error: shipError } = await (adminClient as any)
    .from('shipments')
    .insert({
      order_id: params.orderId,
      courier: params.courier,
      tracking_number: params.trackingNumber.trim(),
      internal_tracking_id: internalId,
      status: 'processing',
      estimated_delivery: estimatedDelivery,
      notes: params.notes?.trim() ?? null,
    })
    .select()
    .single()

  if (shipError || !shipment) {
    console.error('[shipping/create] Error:', shipError)
    return { data: null, error: 'Gagal menyimpan data pengiriman' }
  }

  // Update order status ke "shipped"
  const { error: orderErr } = await adminClient
    .from('orders')
    .update({ status: 'shipped' })
    .eq('id', params.orderId)

  if (orderErr) {
    console.error('[shipping/create] Failed to update order status:', orderErr)
  }

  return { data: shipment as ShipmentData, error: null }
}

// ─── Admin: Update Status Pengiriman ─────────────────────────────────────────

export async function updateShipmentStatus(
  shipmentId: string,
  status: ShipmentStatus,
  notes?: string
): Promise<ActionResult<ShipmentData>> {
  if (!isValidUUID(shipmentId)) return { data: null, error: 'ID shipment tidak valid' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Unauthorized' }

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { data: null, error: 'Hanya admin yang bisa update status' }

  const adminClient = createAdminClient()

  const { data: shipment, error } = await (adminClient as any)
    .from('shipments')
    .update({
      status,
      notes: notes?.trim() ?? undefined,
      updated_at: new Date().toISOString(),
    })
    .eq('id', shipmentId)
    .select()
    .single()

  if (error) return { data: null, error: 'Gagal update status pengiriman' }

  // Jika delivered, update order ke completed
  if (status === 'delivered') {
    await adminClient
      .from('orders')
      .update({ status: 'completed' })
      .eq('id', shipment.order_id)
  }

  return { data: shipment as ShipmentData, error: null }
}

// ─── User: Ambil Shipment Berdasarkan Order ID ────────────────────────────────

export async function getShipmentByOrderId(
  orderId: string
): Promise<ActionResult<ShipmentData>> {
  if (!isValidUUID(orderId)) return { data: null, error: 'ID order tidak valid' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Unauthorized' }

  const { data, error } = await (supabase as any)
    .from('shipments')
    .select('*')
    .eq('order_id', orderId)
    .single()

  if (error || !data) return { data: null, error: null } // null = belum ada shipment (bukan error)

  // Verifikasi bahwa order milik user ini
  const { data: order } = await supabase
    .from('orders')
    .select('user_id')
    .eq('id', orderId)
    .single()

  if (order?.user_id !== user.id) return { data: null, error: 'Akses ditolak' }

  return { data: data as ShipmentData, error: null }
}

// ─── Public: Track via Internal Tracking ID ──────────────────────────────────

export async function trackShipment(
  internalTrackingId: string
): Promise<ActionResult<{
  shipment: ShipmentData
  orderSummary: {
    orderId: string
    itemCount: number
    buyerName: string
  }
}>> {
  if (!isValidTrackingId(internalTrackingId.toUpperCase())) {
    return { data: null, error: 'Format ID resi tidak valid. Contoh: CKJ-20260503-A1B2C3' }
  }

  const adminClient = createAdminClient()

  const { data, error } = await (adminClient as any)
    .from('shipments')
    .select(`
      *,
      orders(
        id, total_price, user_id,
        order_items(quantity, price, products(id, title)),
        profiles(name)
      )
    `)
    .eq('internal_tracking_id', internalTrackingId.toUpperCase())
    .single()

  if (error || !data) {
    return { data: null, error: 'Nomor resi tidak ditemukan. Pastikan ID yang Anda masukkan benar.' }
  }

  const shipment = data as unknown as ShipmentWithOrder
  const order = shipment.orders
  const itemCount = order?.order_items?.length ?? 0
  const buyerName = (order?.profiles?.name ?? 'Pembeli').split(' ')[0] // only first name for privacy

  return {
    data: {
      shipment: data as ShipmentData,
      orderSummary: {
        orderId: order?.id ?? '',
        itemCount,
        buyerName,
      },
    },
    error: null,
  }
}

// ─── User: Konfirmasi Penerimaan ──────────────────────────────────────────────

export async function confirmDelivery(orderId: string): Promise<ActionResult> {
  if (!isValidUUID(orderId)) return { data: null, error: 'ID order tidak valid' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Unauthorized' }

  // Pastikan order milik user dan status shipped
  const { data: order } = await supabase
    .from('orders')
    .select('status, user_id')
    .eq('id', orderId)
    .eq('user_id', user.id)
    .single()

  if (!order) return { data: null, error: 'Order tidak ditemukan' }
  if (order.status !== 'shipped') {
    return { data: null, error: 'Konfirmasi hanya bisa dilakukan saat paket sudah dikirim' }
  }

  const adminClient = createAdminClient()

  // Update order ke completed
  await adminClient
    .from('orders')
    .update({ status: 'completed' })
    .eq('id', orderId)

  // Update shipment ke delivered
  await (adminClient as any)
    .from('shipments')
    .update({ status: 'delivered', updated_at: new Date().toISOString() })
    .eq('order_id', orderId)

  return { data: null, error: null }
}

// ─── Admin: Ambil Semua Shipment ──────────────────────────────────────────────

export async function getAllShipments(): Promise<ActionResult<ShipmentWithOrder[]>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Unauthorized' }

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { data: null, error: 'Forbidden' }

  const adminClient = createAdminClient()

  const { data, error } = await (adminClient as any)
    .from('shipments')
    .select(`
      *,
      orders(
        id, total_price, user_id,
        order_items(quantity, price, products(id, title)),
        profiles(name)
      )
    `)
    .order('created_at', { ascending: false })

  if (error) return { data: null, error: 'Gagal mengambil data pengiriman' }

  return { data: (data as unknown as ShipmentWithOrder[]) ?? [], error: null }
}
