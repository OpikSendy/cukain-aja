/**
 * lib/actions/products.ts
 *
 * Server Actions untuk product management.
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { validateProduct } from '@/lib/utils/validators'
import { isValidUUID } from '@/lib/utils/validators'
import type {
  ActionResult,
  Product,
  ProductWithImages,
  ProductDetail,
  CreateProductInput,
  ProductUpdate,
  ProductFilters,
  PaginationParams,
} from '@/lib/types'

// ─── Public Queries ───────────────────────────────────────────────────────────

/** Ambil semua produk approved untuk halaman publik */
export async function getPublicProducts(
  filters?: ProductFilters,
  pagination?: PaginationParams
): Promise<ActionResult<{ products: ProductWithImages[]; total: number }>> {
  const supabase = await createClient()
  const page = pagination?.page ?? 1
  const limit = pagination?.limit ?? 12
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('products')
    .select('*, product_images(*), profiles(id, name)', { count: 'exact' })
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .range(from, to)

  if (filters?.type) query = query.eq('type', filters.type)
  if (filters?.search) query = query.ilike('title', `%${filters.search}%`)
  if (filters?.minPrice) query = query.gte('price', filters.minPrice)
  if (filters?.maxPrice) query = query.lte('price', filters.maxPrice)

  const { data, error, count } = await query

  if (error) return { data: null, error: 'Gagal mengambil produk' }

  return {
    data: {
      products: (data as ProductWithImages[]) ?? [],
      total: count ?? 0,
    },
    error: null,
  }
}

/** Ambil detail produk untuk halaman public */
export async function getProductDetail(productId: string): Promise<ActionResult<ProductDetail>> {
  if (!isValidUUID(productId)) return { data: null, error: 'ID produk tidak valid' }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      product_images(*),
      profiles(id, name),
      auctions(*),
      verifications(status, notes)
    `)
    .eq('id', productId)
    .eq('status', 'approved')
    .single()

  if (error) return { data: null, error: 'Produk tidak ditemukan' }

  return { data: data as ProductDetail, error: null }
}

// ─── Seller Actions ───────────────────────────────────────────────────────────

/** Ambil semua produk milik seller yang sedang login */
export async function getMyProducts(): Promise<ActionResult<ProductWithImages[]>> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { data: null, error: 'Unauthorized' }

  const { data, error } = await supabase
    .from('products')
    .select('*, product_images(*), profiles(id, name)')
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return { data: null, error: 'Gagal mengambil produk' }

  return { data: (data as ProductWithImages[]) ?? [], error: null }
}

/** Buat produk baru (seller only) */
export async function createProduct(input: CreateProductInput): Promise<ActionResult<Product>> {
  // 1. Validasi input
  const validation = validateProduct(input)
  if (!validation.valid) {
    return { data: null, error: Object.values(validation.errors)[0] }
  }

  const supabase = await createClient()

  // 2. Auth check
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { data: null, error: 'Unauthorized' }

  // 3. Seller & status check
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, status')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'seller') {
    return { data: null, error: 'Hanya seller yang bisa upload produk' }
  }

  if (profile.status !== 'active') {
    return { data: null, error: 'Akun seller kamu belum disetujui admin' }
  }

  // 4. Insert produk
  const { data: product, error: productError } = await supabase
    .from('products')
    .insert({
      seller_id: user.id,
      title: input.title.trim(),
      description: input.description.trim(),
      price: input.type === 'auction' ? null : input.price,
      type: input.type,
      status: 'draft',
    })
    .select()
    .single()

  if (productError) return { data: null, error: 'Gagal membuat produk' }

  // 5. Insert kategori (pivot)
  if (input.categoryIds.length > 0) {
    const categoryLinks = input.categoryIds.map((categoryId) => ({
      product_id: product.id,
      category_id: categoryId,
    }))

    const { error: catError } = await supabase
      .from('product_categories')
      .insert(categoryLinks)

    if (catError) {
      console.error('[products/create] Failed to link categories:', catError)
      // Non-fatal — produk tetap terbuat, kategori bisa di-update
    }
  }

  return { data: product, error: null }
}

/** Update produk (seller only, hanya produk milik sendiri) */
export async function updateProduct(
  productId: string,
  updates: Pick<ProductUpdate, 'title' | 'description' | 'price'>
): Promise<ActionResult<Product>> {
  if (!isValidUUID(productId)) return { data: null, error: 'ID produk tidak valid' }

  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { data: null, error: 'Unauthorized' }

  // RLS akan reject kalau bukan pemilik, tapi kita cek eksplisit juga
  const { data: product, error: updateError } = await supabase
    .from('products')
    .update({
      ...updates,
      // Reset ke draft saat diedit (perlu verifikasi ulang)
      status: 'draft',
    })
    .eq('id', productId)
    .eq('seller_id', user.id) // explicit owner check
    .select()
    .single()

  if (updateError) return { data: null, error: 'Gagal mengupdate produk' }

  return { data: product, error: null }
}

/** Submit produk untuk verifikasi admin */
export async function submitProductForVerification(productId: string): Promise<ActionResult<Product>> {
  if (!isValidUUID(productId)) return { data: null, error: 'ID tidak valid' }

  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { data: null, error: 'Unauthorized' }

  // Cek ada dokumen yang diupload
  const { data: documents } = await supabase
    .from('documents')
    .select('id')
    .eq('product_id', productId)

  if (!documents || documents.length === 0) {
    return { data: null, error: 'Upload minimal 1 dokumen bea cukai sebelum submit' }
  }

  const { data, error } = await supabase
    .from('products')
    .update({ status: 'pending' })
    .eq('id', productId)
    .eq('seller_id', user.id)
    .select()
    .single()

  if (error) return { data: null, error: 'Gagal submit produk' }

  return { data, error: null }
}

/** Hapus produk (seller hanya bisa hapus yang status draft/rejected) */
export async function deleteProduct(productId: string): Promise<ActionResult> {
  if (!isValidUUID(productId)) return { data: null, error: 'ID tidak valid' }

  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { data: null, error: 'Unauthorized' }

  // Cek status dulu
  const { data: product } = await supabase
    .from('products')
    .select('status')
    .eq('id', productId)
    .eq('seller_id', user.id)
    .single()

  if (!product) return { data: null, error: 'Produk tidak ditemukan' }

  if (!['draft', 'rejected'].includes(product.status!)) {
    return { data: null, error: 'Produk yang sudah disetujui tidak bisa dihapus' }
  }

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId)
    .eq('seller_id', user.id)

  if (error) return { data: null, error: 'Gagal menghapus produk' }

  return { data: null, error: null }
}

// ─── Admin Actions ────────────────────────────────────────────────────────────

/** Ambil semua produk pending untuk admin */
export async function getPendingProducts(): Promise<ActionResult<ProductWithImages[]>> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { data: null, error: 'Unauthorized' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return { data: null, error: 'Forbidden' }
  }

  const { data, error } = await supabase
    .from('products')
    .select('*, product_images(*), profiles(id, name)')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  if (error) return { data: null, error: 'Gagal mengambil data' }

  return { data: (data as ProductWithImages[]) ?? [], error: null }
}

/** Approve atau reject produk (admin only) */
export async function reviewProduct(
  productId: string,
  action: 'approved' | 'rejected',
  notes?: string
): Promise<ActionResult> {
  if (!isValidUUID(productId)) return { data: null, error: 'ID tidak valid' }

  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { data: null, error: 'Unauthorized' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return { data: null, error: 'Forbidden' }
  }

  // Update product status
  const { error: productError } = await supabase
    .from('products')
    .update({
      status: action,
      is_verified_beacukai: action === 'approved',
    })
    .eq('id', productId)

  if (productError) return { data: null, error: 'Gagal update status produk' }

  // Upsert verification record
  const { error: verificationError } = await supabase
    .from('verifications')
    .upsert({
      product_id: productId,
      verified_by: user.id,
      status: action,
      notes: notes ?? null,
      verified_at: new Date().toISOString(),
    }, { onConflict: 'product_id' })

  if (verificationError) {
    console.error('[products/review] Failed to upsert verification:', verificationError)
  }

  return { data: null, error: null }
}