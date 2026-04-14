'use client'
/**
 * components/product/ImageUpload.tsx
 *
 * Multi-image upload dengan preview, drag-drop, dan set primary.
 * Panggil server action uploadProductImagesAction setelah produk dibuat.
 */
import { useState, useCallback, useRef, useTransition } from 'react'
import Image from 'next/image'
import { Upload, X, Star, Loader2, ImagePlus } from 'lucide-react'
import {
  uploadProductImagesAction,
  deleteProductImageAction,
  setPrimaryImageAction,
} from '@/lib/actions/uploads'
import { cn } from '@/lib/utils'
import type { ProductImage } from '@/lib/types'
import { STORAGE_CONFIG } from '@/constants/config'

interface ImageUploadProps {
  productId: string
  initialImages?: ProductImage[]
  onChange?: (images: ProductImage[]) => void
}

export function ImageUpload({ productId, initialImages = [], onChange }: ImageUploadProps) {
  const [images, setImages] = useState<ProductImage[]>(initialImages)
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const maxImages = STORAGE_CONFIG.maxImagesPerProduct
  const canUploadMore = images.length < maxImages

  const handleFiles = useCallback(async (files: File[]) => {
    if (!canUploadMore) return
    setError(null)
    setUploading(true)

    try {
      const formData = new FormData()
      files.forEach((f) => formData.append('file', f))

      const result = await uploadProductImagesAction(productId, formData)

      if (result.error) {
        setError(result.error)
        return
      }

      // Refresh image list dari DB
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: freshImages } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', productId)
        .order('is_primary', { ascending: false })

      const updated = freshImages ?? images
      setImages(updated)
      onChange?.(updated)
    } finally {
      setUploading(false)
    }
  }, [productId, images, canUploadMore, onChange])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files).filter((f) =>
      STORAGE_CONFIG.allowedImageTypes.includes(f.type)
    )
    if (files.length > 0) handleFiles(files)
  }, [handleFiles])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length > 0) handleFiles(files)
    e.target.value = '' // reset supaya bisa upload file yang sama
  }

  const handleDelete = async (imageId: string) => {
    setDeletingId(imageId)
    const result = await deleteProductImageAction(imageId, productId)
    if (result.error) {
      setError(result.error)
    } else {
      const updated = images.filter((img) => img.id !== imageId)
      setImages(updated)
      onChange?.(updated)
    }
    setDeletingId(null)
  }

  const handleSetPrimary = async (imageId: string) => {
    const result = await setPrimaryImageAction(imageId, productId)
    if (result.error) { setError(result.error); return }
    const updated = images.map((img) => ({ ...img, is_primary: img.id === imageId }))
    setImages(updated)
    onChange?.(updated)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700">
          Foto Produk <span className="text-red-500">*</span>
        </label>
        <span className="text-xs text-slate-400">{images.length}/{maxImages} foto</span>
      </div>

      {/* Drop zone */}
      {canUploadMore && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all',
            isDragging
              ? 'border-[#0B1D3A] bg-[#0B1D3A]/5'
              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50',
            uploading && 'pointer-events-none opacity-60'
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={STORAGE_CONFIG.allowedImageTypes.join(',')}
            multiple
            className="hidden"
            onChange={handleFileInput}
            disabled={uploading}
          />
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="animate-spin text-slate-400" size={24} />
              <p className="text-sm text-slate-500">Mengupload foto...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                <ImagePlus className="text-slate-400" size={20} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">
                  Drag & drop atau <span className="text-[#0B1D3A] underline">pilih foto</span>
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  JPG, PNG, WebP · Maks {STORAGE_CONFIG.maxImageSize / 1024 / 1024}MB per foto
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}

      {/* Image previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {images.map((img) => (
            <div
              key={img.id}
              className={cn(
                'relative group aspect-square rounded-xl overflow-hidden border-2 transition-all',
                img.is_primary ? 'border-[#C8960C]' : 'border-transparent hover:border-slate-200'
              )}
            >
              <Image
                src={img.image_url ?? ''}
                alt="Foto produk"
                fill
                className="object-cover"
                sizes="120px"
              />

              {/* Primary badge */}
              {img.is_primary && (
                <div className="absolute bottom-1 left-1">
                  <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-[#C8960C] rounded-full
                    text-[9px] font-bold text-white">
                    <Star size={8} fill="white" />
                    Utama
                  </span>
                </div>
              )}

              {/* Hover actions */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100
                transition-opacity flex items-center justify-center gap-1.5">
                {!img.is_primary && (
                  <button
                    type="button"
                    onClick={() => handleSetPrimary(img.id)}
                    title="Jadikan foto utama"
                    className="w-7 h-7 bg-white/90 rounded-full flex items-center justify-center
                      hover:bg-white transition-colors"
                  >
                    <Star size={14} className="text-[#C8960C]" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(img.id)}
                  disabled={deletingId === img.id}
                  title="Hapus foto"
                  className="w-7 h-7 bg-white/90 rounded-full flex items-center justify-center
                    hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  {deletingId === img.id
                    ? <Loader2 size={14} className="animate-spin text-slate-400" />
                    : <X size={14} className="text-red-500" />
                  }
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-slate-400">
        ⭐ Foto pertama atau yang ditandai bintang akan menjadi foto utama produk.
      </p>
    </div>
  )
}