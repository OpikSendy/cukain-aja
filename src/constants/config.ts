/**
 * constants/config.ts
 *
 * Konfigurasi global aplikasi Cukain Aja.
 * Semua env variable diakses dari sini — jangan akses process.env langsung
 * dari luar file ini kecuali untuk supabase client.
 */

// ─── App ──────────────────────────────────────────────────────────────────────

export const APP_CONFIG = {
  name: 'Cukain Aja',
  tagline: 'Marketplace Barang Bea Cukai Resmi Indonesia',
  description:
    'Beli dan lelang barang sitaan bea cukai dengan transparan, aman, dan terpercaya.',
  url: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  supportEmail: 'support@cukainaja.id',
} as const

// ─── Midtrans ─────────────────────────────────────────────────────────────────

export const MIDTRANS_CONFIG = {
  serverKey: process.env.MIDTRANS_SERVER_KEY ?? '',
  clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? '',
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  snapUrl:
    process.env.MIDTRANS_IS_PRODUCTION === 'true'
      ? 'https://app.midtrans.com/snap/snap.js'
      : 'https://app.sandbox.midtrans.com/snap/snap.js',
} as const

// ─── Storage ──────────────────────────────────────────────────────────────────

export const STORAGE_CONFIG = {
  buckets: {
    productImages: 'product-images', // public
    documents: 'documents',          // private
  },
  maxImageSize: 5 * 1024 * 1024,    // 5MB
  maxDocumentSize: 10 * 1024 * 1024, // 10MB
  maxImagesPerProduct: 10,
  allowedImageTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'] as const,
  allowedDocumentTypes: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
} as const

// ─── Pagination ───────────────────────────────────────────────────────────────

export const PAGINATION_CONFIG = {
  defaultLimit: 12,
  maxLimit: 50,
} as const

// ─── Auction ──────────────────────────────────────────────────────────────────

export const AUCTION_CONFIG = {
  minDurationHours: 1,
  maxDurationDays: 30,
  minBidIncrement: 1000, // Rp 1.000 minimum increment
} as const

// ─── Shipping ─────────────────────────────────────────────────────────────────

export const COURIER_LIST = [
  { id: 'jne',      label: 'JNE',          color: '#CC0000', trackUrl: 'https://www.jne.co.id/id/tracking/trace?awbNumber=' },
  { id: 'jnt',      label: 'J&T Express',  color: '#E31E24', trackUrl: 'https://www.jet.co.id/track?awb=' },
  { id: 'sicepat',  label: 'SiCepat',      color: '#F26522', trackUrl: 'https://www.sicepat.com/checkAwb?awb=' },
  { id: 'wahana',   label: 'Wahana',       color: '#003087', trackUrl: 'https://www.wahana.com/tracking?awb=' },
  { id: 'pos',      label: 'Pos Indonesia',color: '#FF6600', trackUrl: 'https://www.posindonesia.co.id/id/tracking?barcode=' },
  { id: 'anteraja', label: 'AnterAja',     color: '#FFCC00', trackUrl: 'https://anteraja.id/tracking?awb=' },
] as const

export type CourierType = typeof COURIER_LIST[number]['id']

export const SHIPPING_CONFIG = {
  trackingIdPrefix: 'CKJ',
  trackingIdLength: 6,
  defaultEstimateDays: 3,
} as const

// ─── Routes ───────────────────────────────────────────────────────────────────

export const ROUTES = {
  home: '/',
  login: '/login',
  register: '/register',
  products: '/products',
  auctions: '/auctions',
  pendingApproval: '/pending-approval',
  unauthorized: '/unauthorized',

  user: {
    dashboard: '/user/dashboard',
    orders: '/user/orders',
    profile: '/user/profile',
  },

  seller: {
    dashboard: '/seller/dashboard',
    products: '/seller/products',
    newProduct: '/seller/products/new',
  },

  admin: {
    dashboard: '/admin/dashboard',
    verifications: '/admin/verifications',
    users: '/admin/users',
    products: '/admin/products',
  },
} as const

// ─── API Routes ───────────────────────────────────────────────────────────────

export const API_ROUTES = {
  webhooks: {
    midtrans: '/api/webhooks/midtrans',
  },
} as const