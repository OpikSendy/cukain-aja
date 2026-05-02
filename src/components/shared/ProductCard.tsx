'use client'
/**
 * components/shared/ProductCard.tsx
 */
import Link from 'next/link'
import { ShieldCheck, Gavel, Package } from 'lucide-react'
import { formatRupiah } from '@/lib/utils/format'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { cn } from '@/lib/utils'
import type { ProductWithImages } from '@/lib/types'

interface ProductCardProps {
  product: ProductWithImages
  /** Tampilkan status badge (untuk seller/admin view) */
  showStatus?: boolean
  /** Tampilkan seller name */
  showSeller?: boolean
  className?: string
}

export function ProductCard({
  product,
  showStatus = false,
  showSeller = false,
  className,
}: ProductCardProps) {
  const primaryImage = product.product_images.find((img) => img.is_primary)
    ?? product.product_images[0]

  const isAuction = product.type === 'auction'

  return (
    <Link
      href={`/products/${product.id}`}
      className={cn(
        'group flex flex-col bg-white rounded-2xl border border-slate-100',
        'hover:border-slate-200 hover:shadow-md transition-all duration-200',
        'overflow-hidden',
        className
      )}
    >
      {/* Image — gunakan <img> biasa agar tidak butuh whitelist domain */}
      <div className="relative aspect-[4/3] bg-slate-50 overflow-hidden">
        {primaryImage?.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={primaryImage.image_url}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="text-slate-300" size={40} />
          </div>
        )}

        {/* Badges overlay */}
        <div className="absolute top-2.5 left-2.5 flex gap-1.5">
          {product.is_verified_beacukai && (
            <span className="flex items-center gap-1 px-2 py-1 bg-white/95 backdrop-blur-sm
              rounded-full text-[10px] font-semibold text-green-700 shadow-sm">
              <ShieldCheck size={11} />
              Verified
            </span>
          )}
          {isAuction && (
            <span className="flex items-center gap-1 px-2 py-1 bg-[#0B1D3A]/90 backdrop-blur-sm
              rounded-full text-[10px] font-semibold text-[#C8960C] shadow-sm">
              <Gavel size={11} />
              Lelang
            </span>
          )}
        </div>

        {showStatus && (
          <div className="absolute top-2.5 right-2.5">
            <StatusBadge status={product.status!} size="sm" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        {showSeller && product.profiles && (
          <p className="text-xs text-slate-400 font-medium truncate">
            {product.profiles.name}
          </p>
        )}

        <h3 className="font-semibold text-[#0B1D3A] text-sm leading-snug line-clamp-2 group-hover:text-[#C8960C] transition-colors">
          {product.title}
        </h3>

        <div className="mt-auto pt-2 border-t border-slate-50">
          {isAuction ? (
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">Harga Awal</p>
              <p className="text-[#0B1D3A] font-bold text-base">
                {product.price ? formatRupiah(product.price) : 'Lihat Lelang'}
              </p>
            </div>
          ) : (
            <p className="text-[#0B1D3A] font-bold text-base">
              {formatRupiah(product.price)}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-slate-100" />
      <div className="p-4 space-y-3">
        <div className="h-3 bg-slate-100 rounded w-3/4" />
        <div className="h-3 bg-slate-100 rounded w-1/2" />
        <div className="h-5 bg-slate-100 rounded w-2/5 mt-2" />
      </div>
    </div>
  )
}