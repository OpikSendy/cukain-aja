/**
 * lib/types/index.ts
 *
 * Custom type definitions untuk Cukain Aja.
 * Ini TERPISAH dari database.ts yang di-generate otomatis.
 * Jangan hapus file ini — database.ts akan overwrite saat `npm run db:types`.
 */

import type { Database } from './database'

// ─── Row Shortcuts ───────────────────────────────────────────────────────────

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Product = Database['public']['Tables']['products']['Row']
export type ProductImage = Database['public']['Tables']['product_images']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type Document = Database['public']['Tables']['documents']['Row']
export type Verification = Database['public']['Tables']['verifications']['Row']
export type Auction = Database['public']['Tables']['auctions']['Row']
export type Bid = Database['public']['Tables']['bids']['Row']
export type Order = Database['public']['Tables']['orders']['Row']
export type OrderItem = Database['public']['Tables']['order_items']['Row']
export type Payment = Database['public']['Tables']['payments']['Row']

// ─── Insert Types ─────────────────────────────────────────────────────────────

export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProductInsert = Database['public']['Tables']['products']['Insert']
export type AuctionInsert = Database['public']['Tables']['auctions']['Insert']
export type BidInsert = Database['public']['Tables']['bids']['Insert']
export type OrderInsert = Database['public']['Tables']['orders']['Insert']
export type OrderItemInsert = Database['public']['Tables']['order_items']['Insert']

// ─── Update Types ─────────────────────────────────────────────────────────────

export type ProductUpdate = Database['public']['Tables']['products']['Update']
export type AuctionUpdate = Database['public']['Tables']['auctions']['Update']
export type OrderUpdate = Database['public']['Tables']['orders']['Update']

// ─── Enum Types ───────────────────────────────────────────────────────────────

export type UserRole = Database['public']['Enums']['user_role']
export type UserStatus = Database['public']['Enums']['user_status']
export type ProductType = Database['public']['Enums']['product_type']
export type ProductStatus = Database['public']['Enums']['product_status']
export type DocType = Database['public']['Enums']['doc_type']
export type VerificationStatus = Database['public']['Enums']['verification_status']
export type AuctionStatus = Database['public']['Enums']['auction_status']
export type OrderStatus = Database['public']['Enums']['order_status']

// ─── Composed / Joined Types ──────────────────────────────────────────────────

/** Product dengan relasi yang sering dibutuhkan di listing */
export type ProductWithImages = Product & {
    product_images: ProductImage[]
    profiles: Pick<Profile, 'id' | 'name'> | null
}

/** Product detail lengkap untuk halaman detail */
export type ProductDetail = Product & {
    product_images: ProductImage[]
    profiles: Pick<Profile, 'id' | 'name'> | null
    auctions: Auction | null
    verifications: Pick<Verification, 'status' | 'notes'> | null
}

/** Auction dengan data produk */
export type AuctionWithProduct = Auction & {
    products: ProductWithImages | null
}

/** Bid dengan data bidder */
export type BidWithBidder = Bid & {
    profiles: Pick<Profile, 'id' | 'name'> | null
}

/** Order dengan items */
export type OrderWithItems = {
    id: string
    created_at: string | null
    total_price: number | null
    status: 'pending' | 'paid' | 'shipped' | 'completed' | 'canceled' | null
    payment_method: string | null
    user_id: string | null

    order_items: {
        id: string
        order_id: string | null
        product_id: string | null
        price: number | null
        quantity: number | null
        products: {
            id: string
            title: string
        } | null
    }[]

    payments: {
        payment_status: string | null
        payment_url: string | null
    }[] // <-- HARUS array
}

// ─── Action Result Type ───────────────────────────────────────────────────────

/**
 * Return type standar untuk semua server actions.
 * WAJIB digunakan — tidak boleh throw error langsung ke client.
 *
 * @example
 * async function createProduct(): Promise<ActionResult<Product>> {
 *   return { data: product, error: null }
 * }
 */
export type ActionResult<T = void> = {
    data: T | null
    error: string | null
}

// ─── Form / Input Types ───────────────────────────────────────────────────────

export interface RegisterInput {
    name: string
    email: string
    password: string
    role: Extract<UserRole, 'user' | 'seller'>
}

export interface LoginInput {
    email: string
    password: string
}

export interface CreateProductInput {
    title: string
    description: string
    price: number
    type: ProductType
    categoryIds: string[]
}

export interface CreateAuctionInput {
    productId: string
    startPrice: number
    startTime: Date
    endTime: Date
}

export interface CreateOrderInput {
    productId: string
    quantity?: number
}

// ─── UI State Types ───────────────────────────────────────────────────────────

export interface PaginationParams {
    page: number
    limit: number
}

export interface ProductFilters {
    categorySlug?: string
    type?: ProductType
    minPrice?: number
    maxPrice?: number
    search?: string
}

export interface AuctionFilters {
    status?: AuctionStatus
    categorySlug?: string
}