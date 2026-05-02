'use server'

/**
 * lib/services/storage.ts
 *
 * Service untuk upload/delete file ke Supabase Storage.
 * - product-images → public bucket (foto produk)
 * - documents → private bucket (dokumen bea cukai)
 *
 * Gunakan di Server Actions — jangan import langsung dari client component.
 */

import { createClient } from '@/lib/supabase/server'
import { validateImageFile, validateDocumentFile } from '@/lib/utils/validators'
import type { ActionResult } from '@/lib/types'

// ─── Constants ────────────────────────────────────────────────────────────────

const BUCKETS = {
  IMAGES: 'product-images',
  DOCUMENTS: 'documents',
} as const

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Generate path file yang unik untuk storage.
 * Format: {userId}/{timestamp}-{randomId}.{ext}
 */
function generateFilePath(userId: string, fileName: string): string {
  const ext = fileName.split('.').pop() ?? 'bin'
  const timestamp = Date.now()
  const randomId = Math.random().toString(36).substring(2, 8)
  return `${userId}/${timestamp}-${randomId}.${ext}`
}

// ─── Image Upload ─────────────────────────────────────────────────────────────

/**
 * Upload foto produk ke bucket public.
 * Return: public URL gambar.
 */
export async function uploadProductImage(
  file: File,
  userId: string
): Promise<ActionResult<{ url: string; path: string }>> {
  // Validasi file
  const validation = validateImageFile(file)
  if (!validation.valid) {
    return { data: null, error: Object.values(validation.errors)[0] }
  }

  const supabase = await createClient()
  const filePath = generateFilePath(userId, file.name)

  const { error: uploadError } = await supabase.storage
    .from(BUCKETS.IMAGES)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadError) {
    if (uploadError.message.includes('Duplicate')) {
      return { data: null, error: 'File sudah ada. Coba lagi.' }
    }
    return { data: null, error: 'Gagal mengupload gambar' }
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(BUCKETS.IMAGES)
    .getPublicUrl(filePath)

  return { data: { url: publicUrl, path: filePath }, error: null }
}

/**
 * Upload multiple foto produk.
 * Return: array URLs.
 */
export async function uploadProductImages(
  files: File[],
  userId: string
): Promise<ActionResult<{ url: string; path: string }[]>> {
  if (files.length === 0) return { data: [], error: null }
  if (files.length > 10) return { data: null, error: 'Maksimal 10 foto per produk' }

  const results = await Promise.allSettled(
    files.map((file) => uploadProductImage(file, userId))
  )

  const uploaded: { url: string; path: string }[] = []
  const errors: string[] = []

  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value.data) {
      uploaded.push(result.value.data)
    } else {
      errors.push(`File ${index + 1}: ${result.status === 'rejected' ? 'Upload gagal' : result.value.error}`)
    }
  })

  if (uploaded.length === 0) {
    return { data: null, error: 'Semua foto gagal diupload' }
  }

  // Partial success — return yang berhasil dengan warning di console
  if (errors.length > 0) {
    console.warn('[storage/uploadProductImages] Partial upload failure:', errors)
  }

  return { data: uploaded, error: null }
}

/**
 * Hapus foto produk dari storage.
 */
export async function deleteProductImage(filePath: string): Promise<ActionResult> {
  const supabase = await createClient()

  const { error } = await supabase.storage
    .from(BUCKETS.IMAGES)
    .remove([filePath])

  if (error) return { data: null, error: 'Gagal menghapus gambar' }

  return { data: null, error: null }
}

// ─── Document Upload (Private Bucket) ────────────────────────────────────────

/**
 * Upload dokumen bea cukai ke bucket private.
 * Return: signed URL (expires 1 jam) untuk preview.
 */
export async function uploadDocument(
  file: File,
  userId: string,
  productId: string
): Promise<ActionResult<{ signedUrl: string; path: string }>> {
  const validation = validateDocumentFile(file)
  if (!validation.valid) {
    return { data: null, error: Object.values(validation.errors)[0] }
  }

  const supabase = await createClient()

  // Sertakan productId dalam path untuk organisasi
  const ext = file.name.split('.').pop() ?? 'bin'
  const timestamp = Date.now()
  const filePath = `${userId}/${productId}/${timestamp}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKETS.DOCUMENTS)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadError) return { data: null, error: 'Gagal mengupload dokumen' }

  // Generate signed URL (hanya berlaku 1 jam)
  const { data: signedData, error: signedError } = await supabase.storage
    .from(BUCKETS.DOCUMENTS)
    .createSignedUrl(filePath, 60 * 60) // 1 hour

  if (signedError || !signedData) {
    return { data: null, error: 'Dokumen terupload tapi gagal generate URL' }
  }

  return { data: { signedUrl: signedData.signedUrl, path: filePath }, error: null }
}

/**
 * Generate fresh signed URL untuk dokumen (diperlukan karena signed URL expire).
 * Dipanggil saat admin ingin melihat dokumen.
 */
export async function getDocumentSignedUrl(
  filePath: string,
  expiresInSeconds: number = 3600
): Promise<ActionResult<{ signedUrl: string }>> {
  const supabase = await createClient()

  const { data, error } = await supabase.storage
    .from(BUCKETS.DOCUMENTS)
    .createSignedUrl(filePath, expiresInSeconds)

  if (error || !data) return { data: null, error: 'Gagal generate URL dokumen' }

  return { data: { signedUrl: data.signedUrl }, error: null }
}

/**
 * Hapus dokumen dari storage.
 */
export async function deleteDocument(filePath: string): Promise<ActionResult> {
  const supabase = await createClient()

  const { error } = await supabase.storage
    .from(BUCKETS.DOCUMENTS)
    .remove([filePath])

  if (error) return { data: null, error: 'Gagal menghapus dokumen' }

  return { data: null, error: null }
}

// ─── DB Record Helpers ────────────────────────────────────────────────────────

/**
 * Simpan record foto produk ke DB setelah upload berhasil.
 * Foto pertama otomatis jadi primary.
 */
export async function saveProductImageRecords(
  productId: string,
  images: { url: string; path: string }[],
  firstIsPrimary: boolean = true
): Promise<ActionResult> {
  if (images.length === 0) return { data: null, error: null }

  const supabase = await createClient()

  const records = images.map((img, index) => ({
    product_id: productId,
    image_url: img.url,
    is_primary: firstIsPrimary && index === 0,
  }))

  const { error } = await supabase
    .from('product_images')
    .insert(records)

  if (error) return { data: null, error: 'Gagal menyimpan data gambar' }

  return { data: null, error: null }
}

/**
 * Simpan record dokumen ke DB setelah upload berhasil.
 */
export async function saveDocumentRecord(
  productId: string,
  filePath: string,
  documentType: 'invoice' | 'beacukai' | 'lainnya'
): Promise<ActionResult> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('documents')
    .insert({
      product_id: productId,
      file_url: filePath, // simpan path, bukan signed URL (expired)
      document_type: documentType,
      status: 'pending',
    })

  if (error) return { data: null, error: 'Gagal menyimpan data dokumen' }

  return { data: null, error: null }
}