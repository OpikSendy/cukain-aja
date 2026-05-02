'use client'
/**
 * components/product/ProductImageGallery.tsx
 *
 * Image gallery dengan thumbnail nav untuk halaman detail produk.
 * Menggunakan <img> biasa (bukan next/image) agar tidak butuh whitelist domain.
 */
import { useState } from 'react'
import { ChevronLeft, ChevronRight, Package } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ProductImage } from '@/lib/types'

interface ProductImageGalleryProps {
  images: ProductImage[]
  title: string
}

export function ProductImageGallery({ images, title }: ProductImageGalleryProps) {
  const sorted = [...images].sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0))
  const [activeIndex, setActiveIndex] = useState(0)

  const activeImage = sorted[activeIndex]

  const prev = () => setActiveIndex((i) => (i === 0 ? sorted.length - 1 : i - 1))
  const next = () => setActiveIndex((i) => (i === sorted.length - 1 ? 0 : i + 1))

  if (sorted.length === 0) {
    return (
      <div className="aspect-square bg-slate-50 rounded-2xl flex items-center justify-center">
        <Package className="text-slate-200" size={64} />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-50 group">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={activeImage?.image_url ?? ''}
          alt={title}
          className="w-full h-full object-cover"
        />

        {/* Nav arrows */}
        {sorted.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 backdrop-blur-sm
                rounded-full flex items-center justify-center shadow opacity-0 group-hover:opacity-100
                transition-opacity hover:bg-white"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 backdrop-blur-sm
                rounded-full flex items-center justify-center shadow opacity-0 group-hover:opacity-100
                transition-opacity hover:bg-white"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}

        {/* Counter */}
        {sorted.length > 1 && (
          <div className="absolute bottom-3 right-3 px-2.5 py-1 bg-black/50 rounded-full
            text-white text-xs font-medium">
            {activeIndex + 1}/{sorted.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {sorted.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {sorted.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setActiveIndex(i)}
              className={cn(
                'w-16 h-16 shrink-0 rounded-xl overflow-hidden border-2 transition-all',
                i === activeIndex ? 'border-[#0B1D3A]' : 'border-transparent opacity-60 hover:opacity-100'
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.image_url ?? ''}
                alt={`Foto ${i + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}