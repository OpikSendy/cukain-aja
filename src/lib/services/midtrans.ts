/**
 * lib/services/midtrans.ts
 *
 * Service untuk integrasi Midtrans payment gateway.
 * Hanya bisa dipanggil dari server (server actions / API routes).
 *
 * Docs: https://docs.midtrans.com
 */

import { MIDTRANS_CONFIG } from '@/constants/config'
import type { ActionResult } from '@/lib/types'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MidtransCustomer {
  id: string
  name: string
  email: string
}

export interface MidtransItemDetail {
  id: string
  name: string
  price: number
  quantity: number
}

export interface MidtransSnapResponse {
  token: string
  redirectUrl: string
}

export interface MidtransNotification {
  transaction_id: string
  order_id: string
  transaction_status: string
  fraud_status: string
  payment_type: string
  gross_amount: string
  signature_key: string
  status_code: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Encode server key untuk Basic Auth header */
function getAuthHeader(): string {
  const encoded = Buffer.from(`${MIDTRANS_CONFIG.serverKey}:`).toString('base64')
  return `Basic ${encoded}`
}

/** Base URL API Midtrans sesuai environment */
function getSnapApiUrl(): string {
  return MIDTRANS_CONFIG.isProduction
    ? 'https://app.midtrans.com/snap/v1/transactions'
    : 'https://app.sandbox.midtrans.com/snap/v1/transactions'
}

function getCoreApiUrl(): string {
  return MIDTRANS_CONFIG.isProduction
    ? 'https://api.midtrans.com/v2'
    : 'https://api.sandbox.midtrans.com/v2'
}

// ─── Snap Token ───────────────────────────────────────────────────────────────

/**
 * Buat Snap token untuk payment popup di frontend.
 * orderId harus unik — gunakan UUID order dari DB.
 */
export async function createSnapToken(
  orderId: string,
  totalAmount: number,
  customer: MidtransCustomer,
  items: MidtransItemDetail[]
): Promise<ActionResult<MidtransSnapResponse>> {
  // Validasi total
  const itemsTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  if (Math.round(itemsTotal) !== Math.round(totalAmount)) {
    return { data: null, error: 'Total amount tidak sesuai dengan items' }
  }

  const payload = {
    transaction_details: {
      order_id: orderId,
      gross_amount: Math.round(totalAmount),
    },
    customer_details: {
      first_name: customer.name,
      email: customer.email,
      customer_id: customer.id,
    },
    item_details: items.map((item) => ({
      id: item.id,
      name: item.name.substring(0, 50), // Midtrans max 50 chars
      price: Math.round(item.price),
      quantity: item.quantity,
    })),
    callbacks: {
      finish: `${process.env.NEXT_PUBLIC_APP_URL}/orders/${orderId}?payment=finish`,
      error: `${process.env.NEXT_PUBLIC_APP_URL}/orders/${orderId}?payment=error`,
      pending: `${process.env.NEXT_PUBLIC_APP_URL}/orders/${orderId}?payment=pending`,
    },
  }

  try {
    const response = await fetch(getSnapApiUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': getAuthHeader(),
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('[midtrans/createSnapToken] API Error:', errorData)
      return { data: null, error: 'Gagal membuat payment token' }
    }

    const data = await response.json()

    return {
      data: {
        token: data.token,
        redirectUrl: data.redirect_url,
      },
      error: null,
    }
  } catch (err) {
    console.error('[midtrans/createSnapToken] Network Error:', err)
    return { data: null, error: 'Gagal terhubung ke payment gateway' }
  }
}

// ─── Webhook Validation ───────────────────────────────────────────────────────

/**
 * Validasi signature Midtrans webhook notification.
 * WAJIB dipanggil sebelum memproses apapun dari webhook.
 *
 * Signature = SHA512(orderId + statusCode + grossAmount + serverKey)
 */
export async function validateWebhookSignature(
  notification: MidtransNotification
): Promise<boolean> {
  const { order_id, status_code, gross_amount, signature_key } = notification

  const signatureString = `${order_id}${status_code}${gross_amount}${MIDTRANS_CONFIG.serverKey}`

  // Gunakan Web Crypto API (tersedia di Node.js 18+ dan Edge Runtime)
  const msgBuffer = new TextEncoder().encode(signatureString)
  const hashBuffer = await crypto.subtle.digest('SHA-512', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const computedSignature = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

  return computedSignature === signature_key
}

// ─── Transaction Status ───────────────────────────────────────────────────────

/**
 * Map Midtrans transaction_status ke order_status internal.
 */
export function mapMidtransStatus(
  transactionStatus: string,
  fraudStatus?: string
): 'pending' | 'paid' | 'canceled' | null {
  switch (transactionStatus) {
    case 'capture':
      if (fraudStatus === 'challenge') return 'pending' // tunggu review
      if (fraudStatus === 'accept') return 'paid'
      return null

    case 'settlement':
      return 'paid'

    case 'pending':
      return 'pending'

    case 'deny':
    case 'cancel':
    case 'expire':
      return 'canceled'

    default:
      return null
  }
}

/**
 * Cek status transaksi langsung ke Midtrans API.
 * Gunakan ini untuk verifikasi tambahan saat webhook diterima.
 */
export async function checkTransactionStatus(
  orderId: string
): Promise<ActionResult<{ transactionStatus: string; paymentType: string }>> {
  try {
    const response = await fetch(`${getCoreApiUrl()}/${orderId}/status`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': getAuthHeader(),
      },
    })

    if (!response.ok) {
      return { data: null, error: 'Gagal cek status transaksi' }
    }

    const data = await response.json()

    return {
      data: {
        transactionStatus: data.transaction_status,
        paymentType: data.payment_type,
      },
      error: null,
    }
  } catch {
    return { data: null, error: 'Gagal terhubung ke Midtrans' }
  }
}