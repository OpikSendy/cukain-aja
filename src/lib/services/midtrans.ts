/**
 * lib/services/midtrans.ts — v2 Complete
 * SERVER ONLY — tidak boleh di-import dari 'use client'
 */
import { MIDTRANS_CONFIG } from '@/constants/config'
import type { ActionResult } from '@/lib/types'

export interface MidtransCustomer {
  id: string; name: string; email: string; phone?: string
}
export interface MidtransItemDetail {
  id: string; name: string; price: number; quantity: number
  category?: string; merchant_name?: string
}
export interface SnapTokenResponse { token: string; redirectUrl: string }
export interface MidtransNotification {
  transaction_id: string; order_id: string
  transaction_status: string; fraud_status?: string
  payment_type: string; gross_amount: string
  signature_key: string; status_code: string
  settlement_time?: string; transaction_time: string
}
export type InternalPaymentStatus = 'pending' | 'paid' | 'canceled' | 'failed'

function getAuthHeader(): string {
  if (!MIDTRANS_CONFIG.serverKey) throw new Error('MIDTRANS_SERVER_KEY not configured')
  return `Basic ${Buffer.from(`${MIDTRANS_CONFIG.serverKey}:`).toString('base64')}`
}
function getSnapUrl() {
  return MIDTRANS_CONFIG.isProduction
    ? 'https://app.midtrans.com/snap/v1/transactions'
    : 'https://app.sandbox.midtrans.com/snap/v1/transactions'
}
function getCoreApiBase() {
  return MIDTRANS_CONFIG.isProduction
    ? 'https://api.midtrans.com/v2'
    : 'https://api.sandbox.midtrans.com/v2'
}

export async function createSnapToken(params: {
  orderId: string; amount: number
  customer: MidtransCustomer; items: MidtransItemDetail[]
}): Promise<ActionResult<SnapTokenResponse>> {
  const { orderId, amount, customer, items } = params
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const payload = {
    transaction_details: { order_id: orderId, gross_amount: Math.round(amount) },
    customer_details: {
      customer_id: customer.id,
      first_name: customer.name.split(' ')[0],
      last_name: customer.name.split(' ').slice(1).join(' ') || undefined,
      email: customer.email,
      phone: customer.phone,
    },
    item_details: items.map(item => ({
      id: item.id.slice(0, 50),
      price: Math.round(item.price),
      quantity: item.quantity,
      name: item.name.slice(0, 50),
      category: item.category ?? 'Bea Cukai',
    })),
    callbacks: {
      finish: `${baseUrl}/user/orders/${orderId}?payment=finish`,
      error: `${baseUrl}/user/orders/${orderId}?payment=error`,
      pending: `${baseUrl}/user/orders/${orderId}?payment=pending`,
    },
    custom_expiry: { expiry_duration: 1440, unit: 'minute' },
    credit_card: { secure: true },
  }

  try {
    const res = await fetch(getSnapUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: getAuthHeader() },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) {
      return { data: null, error: data.error_messages?.join(', ') ?? 'Payment gateway error' }
    }
    return { data: { token: data.token, redirectUrl: data.redirect_url }, error: null }
  } catch {
    return { data: null, error: 'Gagal terhubung ke payment gateway' }
  }
}

export async function verifyWebhookSignature(n: MidtransNotification): Promise<boolean> {
  const raw = `${n.order_id}${n.status_code}${n.gross_amount}${MIDTRANS_CONFIG.serverKey}`
  const hash = await crypto.subtle.digest('SHA-512', new TextEncoder().encode(raw))
  const computed = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
  return computed === n.signature_key
}

export async function getTransactionStatus(orderId: string): Promise<ActionResult<{
  transactionStatus: string; paymentType: string; grossAmount: string; fraudStatus?: string
}>> {
  try {
    const res = await fetch(`${getCoreApiBase()}/${orderId}/status`, {
      headers: { Accept: 'application/json', Authorization: getAuthHeader() },
    })
    const data = await res.json()
    if (!res.ok) return { data: null, error: 'Gagal cek status pembayaran' }
    return {
      data: {
        transactionStatus: data.transaction_status,
        paymentType: data.payment_type,
        grossAmount: data.gross_amount,
        fraudStatus: data.fraud_status,
      },
      error: null,
    }
  } catch {
    return { data: null, error: 'Network error' }
  }
}

export function mapMidtransStatus(status: string, fraud?: string): InternalPaymentStatus {
  if (status === 'capture') return fraud === 'challenge' ? 'pending' : 'paid'
  if (status === 'settlement') return 'paid'
  if (status === 'pending') return 'pending'
  if (['deny', 'cancel', 'expire'].includes(status)) return 'canceled'
  if (status === 'failure') return 'failed'
  return 'pending'
}