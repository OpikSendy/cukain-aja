/**
 * lib/actions/auctions.ts
 *
 * Server Actions untuk auction management.
 * Race condition pada bid ditangani oleh DB function `place_bid`.
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { validateAuction } from '@/lib/utils/validators'
import { isValidUUID } from '@/lib/utils/validators'
import type {
  ActionResult,
  Auction,
  AuctionWithProduct,
  BidWithBidder,
  CreateAuctionInput,
} from '@/lib/types'

// ─── Public Queries ───────────────────────────────────────────────────────────

/** Ambil semua auction aktif untuk halaman publik */
export async function getActiveAuctions(): Promise<ActionResult<AuctionWithProduct[]>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('auctions')
    .select(`
      *,
      products(
        *,
        product_images(*),
        profiles(id, name)
      )
    `)
    .eq('status', 'active')
    .order('end_time', { ascending: true })

  if (error) return { data: null, error: 'Gagal mengambil data lelang' }

  return { data: (data as AuctionWithProduct[]) ?? [], error: null }
}

/** Ambil detail auction beserta riwayat bid */
export async function getAuctionDetail(auctionId: string): Promise<ActionResult<{
  auction: AuctionWithProduct
  bids: BidWithBidder[]
}>> {
  if (!isValidUUID(auctionId)) return { data: null, error: 'ID tidak valid' }

  const supabase = await createClient()

  const { data: auction, error: auctionError } = await supabase
    .from('auctions')
    .select(`
      *,
      products(
        *,
        product_images(*),
        profiles(id, name)
      )
    `)
    .eq('id', auctionId)
    .single()

  if (auctionError || !auction) return { data: null, error: 'Lelang tidak ditemukan' }

  const { data: bids, error: bidsError } = await supabase
    .from('bids')
    .select('*, profiles(id, name)')
    .eq('auction_id', auctionId)
    .order('amount', { ascending: false })
    .limit(50)

  if (bidsError) return { data: null, error: 'Gagal mengambil riwayat bid' }

  return {
    data: {
      auction: auction as AuctionWithProduct,
      bids: (bids as BidWithBidder[]) ?? [],
    },
    error: null,
  }
}

// ─── Seller Actions ───────────────────────────────────────────────────────────

/** Buat auction baru untuk produk yang sudah approved */
export async function createAuction(input: CreateAuctionInput): Promise<ActionResult<Auction>> {
  const validation = validateAuction(input)
  if (!validation.valid) {
    return { data: null, error: Object.values(validation.errors)[0] }
  }

  if (!isValidUUID(input.productId)) return { data: null, error: 'ID produk tidak valid' }

  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { data: null, error: 'Unauthorized' }

  // Validasi ownership + status produk
  const { data: product } = await supabase
    .from('products')
    .select('seller_id, status, type')
    .eq('id', input.productId)
    .single()

  if (!product) return { data: null, error: 'Produk tidak ditemukan' }
  if (product.seller_id !== user.id) return { data: null, error: 'Bukan produk kamu' }
  if (product.status !== 'approved') return { data: null, error: 'Produk harus disetujui admin dulu' }
  if (product.type !== 'auction') return { data: null, error: 'Produk ini bukan tipe lelang' }

  // Cek belum ada auction aktif untuk produk ini
  const { data: existingAuction } = await supabase
    .from('auctions')
    .select('id, status')
    .eq('product_id', input.productId)
    .single()

  if (existingAuction && ['upcoming', 'active'].includes(existingAuction.status!)) {
    return { data: null, error: 'Produk ini sudah memiliki lelang aktif' }
  }

  const { data: auction, error: auctionError } = await supabase
    .from('auctions')
    .insert({
      product_id: input.productId,
      start_price: input.startPrice,
      current_price: input.startPrice,
      start_time: input.startTime.toISOString(),
      end_time: input.endTime.toISOString(),
      status: 'upcoming',
    })
    .select()
    .single()

  if (auctionError) return { data: null, error: 'Gagal membuat lelang' }

  return { data: auction, error: null }
}

// ─── User Actions ─────────────────────────────────────────────────────────────

/**
 * Place bid pada auction aktif.
 * Menggunakan DB function `place_bid` untuk menghindari race condition.
 */
export async function placeBid(
  auctionId: string,
  amount: number
): Promise<ActionResult<{ newPrice: number }>> {
  if (!isValidUUID(auctionId)) return { data: null, error: 'ID tidak valid' }
  if (!amount || amount <= 0) return { data: null, error: 'Jumlah bid tidak valid' }

  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { data: null, error: 'Login dulu untuk ikut lelang' }

  // Cek auction masih aktif
  const { data: auction } = await supabase
    .from('auctions')
    .select('status, current_price, end_time, products(seller_id)')
    .eq('id', auctionId)
    .single()

  if (!auction) return { data: null, error: 'Lelang tidak ditemukan' }
  if (auction.status !== 'active') return { data: null, error: 'Lelang tidak sedang aktif' }

  // Seller tidak bisa bid di produk sendiri
  const product = auction.products as { seller_id: string } | null
  if (product?.seller_id === user.id) {
    return { data: null, error: 'Tidak bisa bid di produk sendiri' }
  }

  if (new Date(auction.end_time!) < new Date()) {
    return { data: null, error: 'Waktu lelang sudah habis' }
  }

  // Gunakan DB function untuk menghindari race condition
  const { error: bidError } = await supabase.rpc('place_bid', {
    p_auction_id: auctionId,
    p_amount: amount,
  })

  if (bidError) {
    if (bidError.message.includes('Bid must be higher')) {
      return {
        data: null,
        error: `Bid harus lebih tinggi dari harga saat ini (${auction.current_price})`,
      }
    }
    return { data: null, error: 'Gagal memasang bid' }
  }

  return { data: { newPrice: amount }, error: null }
}

// ─── Admin / System Actions ───────────────────────────────────────────────────

/**
 * Tutup auction yang sudah melewati end_time.
 * Dipanggil oleh cron job atau webhook trigger.
 * Hanya bisa dipanggil dari server dengan service role.
 */
export async function endExpiredAuctions(): Promise<ActionResult<{ count: number }>> {
  const supabase = await createClient()

  // Ambil auction yang sudah expired tapi masih active
  const { data: expiredAuctions, error: fetchError } = await supabase
    .from('auctions')
    .select('id, product_id')
    .eq('status', 'active')
    .lt('end_time', new Date().toISOString())

  if (fetchError) return { data: null, error: 'Gagal ambil data lelang expired' }
  if (!expiredAuctions || expiredAuctions.length === 0) {
    return { data: { count: 0 }, error: null }
  }

  const auctionIds = expiredAuctions.map((a) => a.id)

  // Update status ke ended
  const { error: updateError } = await supabase
    .from('auctions')
    .update({ status: 'ended' })
    .in('id', auctionIds)

  if (updateError) return { data: null, error: 'Gagal menutup lelang' }

  // TODO: Generate order untuk pemenang setiap auction
  // Ini akan diimplementasikan di Phase 5 (Payment)

  return { data: { count: expiredAuctions.length }, error: null }
}

/** Ambil semua auction milik seller yang login */
export async function getMyAuctions(): Promise<ActionResult<AuctionWithProduct[]>> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { data: null, error: 'Unauthorized' }

  const { data, error } = await supabase
    .from('auctions')
    .select(`
      *,
      products!inner(
        *,
        product_images(*),
        profiles(id, name)
      )
    `)
    .eq('products.seller_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return { data: null, error: 'Gagal mengambil data lelang' }

  return { data: (data as AuctionWithProduct[]) ?? [], error: null }
}