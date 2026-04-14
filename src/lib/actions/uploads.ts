/**
 * lib/actions/uploads.ts
 *
 * Server Actions untuk upload flow:
 * - Upload foto produk ke bucket public
 * - Upload dokumen bea cukai ke bucket private
 * - Semua validasi dilakukan di server
 *
 * PENTING: Menerima FormData karena File tidak bisa dipass langsung ke server action.
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import {
  uploadProductImages,
  uploadDocument,
  saveProductImageRecords,
  saveDocumentRecord,
  deleteProductImage,
} from '@/lib/services/storage'
import { isValidUUID } from '@/lib/utils/validators'
import { STORAGE_CONFIG } from '@/constants/config'
import type { ActionResult, DocType } from '@/lib/types'

// ─── Upload Product Images ────────────────────────────────────────────────────

export async function uploadProductImagesAction(
  productId: string,
  formData: FormData
): Promise<ActionResult<{ urls: string[]; count: number }>> {
  if (!isValidUUID(productId)) return { data: null, error: 'ID produk tidak valid' }

  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { data: null, error: 'Unauthorized' }

  // Pastikan produk milik seller ini
  const { data: product } = await supabase
    .from('products')
    .select('seller_id')
    .eq('id', productId)
    .single()

  if (!product || product.seller_id !== user.id) {
    return { data: null, error: 'Produk tidak ditemukan atau bukan milik kamu' }
  }

  // Ambil files dari FormData
  const files: File[] = []
  for (const [, value] of formData.entries()) {
    if (value instanceof File && value.size > 0) {
      files.push(value)
    }
  }

  if (files.length === 0) return { data: null, error: 'Tidak ada file yang dipilih' }
  if (files.length > STORAGE_CONFIG.maxImagesPerProduct) {
    return { data: null, error: `Maksimal ${STORAGE_CONFIG.maxImagesPerProduct} foto per produk` }
  }

  // Cek sudah berapa gambar yang ada
  const { count: existingCount } = await supabase
    .from('product_images')
    .select('id', { count: 'exact', head: true })
    .eq('product_id', productId)

  if ((existingCount ?? 0) + files.length > STORAGE_CONFIG.maxImagesPerProduct) {
    return {
      data: null,
      error: `Produk sudah punya ${existingCount} foto. Tambah maksimal ${STORAGE_CONFIG.maxImagesPerProduct - (existingCount ?? 0)} lagi.`,
    }
  }

  // Upload ke storage
  const uploadResult = await uploadProductImages(files, user.id)
  if (uploadResult.error || !uploadResult.data) {
    return { data: null, error: uploadResult.error ?? 'Upload gagal' }
  }

  // Simpan ke DB — foto pertama jadi primary kalau belum ada foto sebelumnya
  const isFirstUpload = (existingCount ?? 0) === 0
  const saveResult = await saveProductImageRecords(productId, uploadResult.data, isFirstUpload)
  if (saveResult.error) {
    return { data: null, error: saveResult.error }
  }

  return {
    data: {
      urls: uploadResult.data.map((img) => img.url),
      count: uploadResult.data.length,
    },
    error: null,
  }
}

// ─── Delete Product Image ─────────────────────────────────────────────────────

export async function deleteProductImageAction(
  imageId: string,
  productId: string
): Promise<ActionResult> {
  if (!isValidUUID(imageId) || !isValidUUID(productId)) {
    return { data: null, error: 'ID tidak valid' }
  }

  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { data: null, error: 'Unauthorized' }

  // Ambil image record + validasi ownership
  const { data: image } = await supabase
    .from('product_images')
    .select('image_url, is_primary, products(seller_id)')
    .eq('id', imageId)
    .eq('product_id', productId)
    .single()

  if (!image) return { data: null, error: 'Foto tidak ditemukan' }

  const product = image.products as { seller_id: string } | null
  if (product?.seller_id !== user.id) return { data: null, error: 'Bukan foto produk kamu' }

  // Extract storage path dari URL
  const url = image.image_url ?? ''
  const pathMatch = url.match(/product-images\/(.+)$/)
  if (pathMatch) {
    await deleteProductImage(pathMatch[1])
  }

  // Hapus record dari DB
  const { error: deleteError } = await supabase
    .from('product_images')
    .delete()
    .eq('id', imageId)

  if (deleteError) return { data: null, error: 'Gagal menghapus foto' }

  // Kalau foto yang dihapus adalah primary, set foto lain jadi primary
  if (image.is_primary) {
    const { data: remainingImages } = await supabase
      .from('product_images')
      .select('id')
      .eq('product_id', productId)
      .limit(1)

    if (remainingImages && remainingImages.length > 0) {
      await supabase
        .from('product_images')
        .update({ is_primary: true })
        .eq('id', remainingImages[0].id)
    }
  }

  return { data: null, error: null }
}

// ─── Set Primary Image ────────────────────────────────────────────────────────

export async function setPrimaryImageAction(
  imageId: string,
  productId: string
): Promise<ActionResult> {
  if (!isValidUUID(imageId) || !isValidUUID(productId)) {
    return { data: null, error: 'ID tidak valid' }
  }

  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { data: null, error: 'Unauthorized' }

  // Validasi ownership
  const { data: product } = await supabase
    .from('products')
    .select('seller_id')
    .eq('id', productId)
    .single()

  if (!product || product.seller_id !== user.id) {
    return { data: null, error: 'Bukan produk kamu' }
  }

  // Reset semua ke false, lalu set yang dipilih ke true
  await supabase
    .from('product_images')
    .update({ is_primary: false })
    .eq('product_id', productId)

  const { error } = await supabase
    .from('product_images')
    .update({ is_primary: true })
    .eq('id', imageId)
    .eq('product_id', productId)

  if (error) return { data: null, error: 'Gagal mengubah foto utama' }

  return { data: null, error: null }
}

// ─── Upload Document ──────────────────────────────────────────────────────────

export async function uploadDocumentAction(
  productId: string,
  documentType: DocType,
  formData: FormData
): Promise<ActionResult<{ documentId: string }>> {
  if (!isValidUUID(productId)) return { data: null, error: 'ID produk tidak valid' }

  const validDocTypes: DocType[] = ['invoice', 'beacukai', 'lainnya']
  if (!validDocTypes.includes(documentType)) {
    return { data: null, error: 'Tipe dokumen tidak valid' }
  }

  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { data: null, error: 'Unauthorized' }

  // Validasi ownership produk
  const { data: product } = await supabase
    .from('products')
    .select('seller_id, status')
    .eq('id', productId)
    .single()

  if (!product || product.seller_id !== user.id) {
    return { data: null, error: 'Produk tidak ditemukan' }
  }

  if (!['draft', 'rejected'].includes(product.status!)) {
    return { data: null, error: 'Dokumen hanya bisa diupload untuk produk draft atau yang ditolak' }
  }

  // Ambil file
  const file = formData.get('file') as File | null
  if (!file || file.size === 0) return { data: null, error: 'File dokumen wajib dipilih' }

  // Upload ke private bucket
  const uploadResult = await uploadDocument(file, user.id, productId)
  if (uploadResult.error || !uploadResult.data) {
    return { data: null, error: uploadResult.error ?? 'Upload gagal' }
  }

  // Simpan record ke DB
  const saveResult = await saveDocumentRecord(productId, uploadResult.data.path, documentType)
  if (saveResult.error) {
    return { data: null, error: saveResult.error }
  }

  // Ambil ID document yang baru dibuat
  const { data: newDoc } = await supabase
    .from('documents')
    .select('id')
    .eq('product_id', productId)
    .eq('document_type', documentType)
    .order('created_at' as never, { ascending: false })
    .limit(1)
    .single()

  return { data: { documentId: newDoc?.id ?? '' }, error: null }
}

// ─── Delete Document ──────────────────────────────────────────────────────────

export async function deleteDocumentAction(documentId: string): Promise<ActionResult> {
  if (!isValidUUID(documentId)) return { data: null, error: 'ID tidak valid' }

  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { data: null, error: 'Unauthorized' }

  // Ambil document + validasi ownership via product
  const { data: doc } = await supabase
    .from('documents')
    .select('file_url, product_id, products(seller_id)')
    .eq('id', documentId)
    .single()

  if (!doc) return { data: null, error: 'Dokumen tidak ditemukan' }

  const productOwner = doc.products as { seller_id: string } | null
  if (productOwner?.seller_id !== user.id) {
    return { data: null, error: 'Bukan dokumen produk kamu' }
  }

  // Hapus dari storage
  if (doc.file_url) {
    const { deleteDocument } = await import('@/lib/services/storage')
    await deleteDocument(doc.file_url)
  }

  // Hapus record DB
  const { error } = await supabase.from('documents').delete().eq('id', documentId)
  if (error) return { data: null, error: 'Gagal menghapus dokumen' }

  return { data: null, error: null }
}