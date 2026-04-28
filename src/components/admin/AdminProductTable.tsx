'use client'
/**
 * components/admin/AdminProductTable.tsx
 *
 * Tabel produk untuk admin dengan search + quick review action.
 */
import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Search, ShieldCheck, ShieldOff, Package, ExternalLink } from 'lucide-react'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatRupiah, formatDate } from '@/lib/utils/format'
import { reviewProduct } from '@/lib/actions/products'
import { notify } from '@/components/ui/Toaster'
import { cn } from '@/lib/utils'

export type ProductStatus = 'pending' | 'approved' | 'rejected' | 'draft' | 'sold';

export interface AdminProduct {
    id: string;
    title: string;
    status: ProductStatus | string | null; // Tambahkan null
    type: string | null;                  // Tambahkan null
    price: number | null;
    created_at: string | null;            // Tambahkan null
    is_verified_beacukai: boolean | null; // Tambahkan null
    product_images: {
        image_url: string | null;
        is_primary: boolean
    }[];
    profiles: {
        id: string;
        name: string
    } | null;
}

interface AdminProductTableProps {
    products: AdminProduct[]
    searchQuery?: string
}

export function AdminProductTable({ products, searchQuery }: AdminProductTableProps) {
    const [localSearch, setLocalSearch] = useState(searchQuery ?? '')
    const [list, setList] = useState(products)
    const [isPending, startTransition] = useTransition()
    const [processingId, setProcessingId] = useState<string | null>(null)

    const filtered = localSearch
        ? list.filter(p => p.title.toLowerCase().includes(localSearch.toLowerCase()))
        : list

    const handleQuickReview = (productId: string, action: 'approved' | 'rejected') => {
        setProcessingId(`${productId}-${action}`)
        startTransition(async () => {
            const result = await reviewProduct(productId, action)
            if (result.error) {
                notify.error('Gagal update', result.error)
            } else {
                notify.success(action === 'approved' ? 'Produk disetujui ✓' : 'Produk ditolak')
                setList(prev => prev.map(p =>
                    p.id === productId ? { ...p, status: action } : p
                ))
            }
            setProcessingId(null)
        })
    }

    return (
        <div className="space-y-4">
            {/* Search */}
            <div className="flex items-center gap-2.5 px-4 py-2.5 bg-white border border-slate-200 rounded-xl">
                <Search size={16} className="text-slate-400 shrink-0" />
                <input
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    placeholder="Cari judul produk..."
                    className="flex-1 text-sm text-[#0B1D3A] placeholder:text-slate-400 outline-none bg-transparent"
                />
            </div>

            {filtered.length === 0 ? (
                <div className="text-center py-16 bg-white border border-slate-100 rounded-2xl">
                    <Package className="mx-auto text-slate-200 mb-3" size={32} />
                    <p className="text-slate-400 text-sm">Tidak ada produk ditemukan.</p>
                </div>
            ) : (
                <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
                    {/* Table header */}
                    <div className="grid grid-cols-[auto,1fr,auto,auto,auto] gap-4 px-5 py-3
            border-b border-slate-50 bg-slate-50/50">
                        {['Produk', 'Judul', 'Status', 'Harga', 'Aksi'].map((h) => (
                            <p key={h} className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                                {h}
                            </p>
                        ))}
                    </div>

                    {/* Rows */}
                    <div className="divide-y divide-slate-50">
                        {filtered.map((product) => {
                            const image = product.product_images.find(i => i.is_primary) ?? product.product_images[0]
                            const isProcessing = processingId?.startsWith(product.id)

                            return (
                                <div
                                    key={product.id}
                                    className={cn(
                                        'grid grid-cols-[auto,1fr,auto,auto,auto] gap-4 items-center px-5 py-4',
                                        'hover:bg-slate-50/60 transition-colors',
                                        isProcessing && 'opacity-60'
                                    )}
                                >
                                    {/* Thumbnail */}
                                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                                        {image?.image_url ? (
                                            <img src={image.image_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Package className="text-slate-300" size={16} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Title + seller */}
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-medium text-[#0B1D3A] truncate">{product.title}</p>
                                            {product.is_verified_beacukai && (
                                                <ShieldCheck size={13} className="text-green-500 shrink-0" />
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-400 truncate mt-0.5">
                                            {product.profiles?.name} · {formatDate(product.created_at)} · {product.type}
                                        </p>
                                    </div>

                                    {/* Status */}
                                    <StatusBadge status={product.status!} size="sm" />

                                    {/* Price */}
                                    <p className="text-sm font-semibold text-[#0B1D3A] text-right whitespace-nowrap">
                                        {product.price ? formatRupiah(product.price) : '—'}
                                    </p>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <Link
                                            href={`/products/${product.id}`}
                                            target="_blank"
                                            className="p-1.5 text-slate-400 hover:text-[#0B1D3A] hover:bg-slate-100
                        rounded-lg transition-colors"
                                            title="Lihat produk"
                                        >
                                            <ExternalLink size={14} />
                                        </Link>

                                        {product.status === 'pending' && (
                                            <>
                                                <button
                                                    onClick={() => handleQuickReview(product.id, 'rejected')}
                                                    disabled={isPending}
                                                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50
                            rounded-lg transition-colors"
                                                    title="Tolak"
                                                >
                                                    <ShieldOff size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleQuickReview(product.id, 'approved')}
                                                    disabled={isPending}
                                                    className="p-1.5 text-green-500 hover:text-green-700 hover:bg-green-50
                            rounded-lg transition-colors"
                                                    title="Approve"
                                                >
                                                    <ShieldCheck size={14} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}