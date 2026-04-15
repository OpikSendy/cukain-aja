'use client'
/**
 * components/admin/VerificationQueue.tsx
 *
 * Queue verifikasi produk untuk admin.
 * Tampilkan produk, dokumen, dan action approve/reject.
 */
import { useState, useTransition } from 'react'
import Image from 'next/image'
import { CheckCircle, XCircle, FileText, Package, Loader2, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import { reviewProduct } from '@/lib/actions/products'
import { getDocumentSignedUrl } from '@/lib/services/storage'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatDate, formatRupiah } from '@/lib/utils/format'
import { cn } from '@/lib/utils'

interface VerificationQueueProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  products: any[] // type luas karena joined query dari RSC
}

export function VerificationQueue({ products: initialProducts }: VerificationQueueProps) {
  const [products, setProducts] = useState(initialProducts)
  const [expandedId, setExpandedId] = useState<string | null>(
    initialProducts[0]?.id ?? null
  )
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [isPending, startTransition] = useTransition()
  const [docUrls, setDocUrls] = useState<Record<string, string>>({})
  const [loadingDocId, setLoadingDocId] = useState<string | null>(null)

  const handleReview = (productId: string, action: 'approved' | 'rejected') => {
    setReviewingId(`${productId}-${action}`)
    startTransition(async () => {
      const result = await reviewProduct(productId, action, notes[productId])

      if (result.error) {
        alert(result.error)
        setReviewingId(null)
        return
      }

      // Remove dari queue
      setProducts((prev) => prev.filter((p) => p.id !== productId))
      setReviewingId(null)

      // Buka produk berikutnya
      const remaining = products.filter((p) => p.id !== productId)
      if (remaining.length > 0) setExpandedId(remaining[0].id)
    })
  }

  const handleViewDocument = async (docId: string, filePath: string) => {
    if (docUrls[docId]) {
      window.open(docUrls[docId], '_blank')
      return
    }

    setLoadingDocId(docId)
    const result = await getDocumentSignedUrl(filePath, 3600)
    setLoadingDocId(null)

    if (result.data?.signedUrl) {
      setDocUrls((prev) => ({ ...prev, [docId]: result.data!.signedUrl }))
      window.open(result.data.signedUrl, '_blank')
    }
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-16 space-y-3">
        <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto">
          <CheckCircle className="text-green-400" size={32} />
        </div>
        <p className="font-medium text-slate-700">Semua produk sudah direview!</p>
        <p className="text-slate-400 text-sm">Tidak ada antrian verifikasi saat ini.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {products.map((product) => {
        const isExpanded = expandedId === product.id
        const primaryImage = product.product_images?.find((i: { is_primary: boolean }) => i.is_primary)
          ?? product.product_images?.[0]

        return (
          <div
            key={product.id}
            className="bg-white border border-slate-100 rounded-2xl overflow-hidden"
          >
            {/* ─ Header (always visible) ─ */}
            <button
              type="button"
              onClick={() => setExpandedId(isExpanded ? null : product.id)}
              className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors text-left"
            >
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-50 shrink-0">
                {primaryImage?.image_url ? (
                  <img src={primaryImage.image_url} alt={product.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="text-slate-300" size={20} />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#0B1D3A] text-sm truncate">{product.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-400">{product.profiles?.name}</span>
                  <span className="text-slate-200">·</span>
                  <span className="text-xs text-slate-400">{formatDate(product.created_at)}</span>
                  <span className="text-slate-200">·</span>
                  <span className="text-xs text-slate-400">{product.documents?.length ?? 0} dok</span>
                </div>
              </div>

              <div className="shrink-0">
                {isExpanded ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
              </div>
            </button>

            {/* ─ Expanded detail ─ */}
            {isExpanded && (
              <div className="border-t border-slate-100 p-5 space-y-6">
                {/* Product info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">Tipe</p>
                    <p className="text-[#0B1D3A] capitalize font-medium">{product.type}</p>
                  </div>
                  {product.price && (
                    <div>
                      <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">Harga</p>
                      <p className="text-[#0B1D3A] font-medium">{formatRupiah(product.price)}</p>
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">Deskripsi</p>
                  <p className="text-sm text-slate-700 leading-relaxed line-clamp-4">{product.description}</p>
                </div>

                {/* Images preview */}
                {product.product_images?.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-2">
                      Foto ({product.product_images.length})
                    </p>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {product.product_images.map((img: { id: string; image_url: string | null }) => (
                        <div key={img.id} className="w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-slate-50">
                          <img src={img.image_url ?? ''} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Documents */}
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-2">
                    Dokumen Legal ({product.documents?.length ?? 0})
                  </p>
                  {product.documents?.length > 0 ? (
                    <div className="space-y-2">
                      {product.documents.map((doc: { id: string; document_type: string; file_url: string }) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-3 bg-slate-50 rounded-xl"
                        >
                          <div className="flex items-center gap-2">
                            <FileText size={16} className="text-slate-500" />
                            <span className="text-sm text-slate-700 capitalize">
                              {doc.document_type === 'beacukai' ? 'Dokumen Bea Cukai' :
                               doc.document_type === 'invoice' ? 'Invoice / Faktur' :
                               'Dokumen Lainnya'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleViewDocument(doc.id, doc.file_url)}
                            disabled={loadingDocId === doc.id}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium
                              text-[#0B1D3A] border border-slate-200 rounded-lg hover:bg-white transition-colors
                              disabled:opacity-50"
                          >
                            {loadingDocId === doc.id ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <ExternalLink size={12} />
                            )}
                            Lihat
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-red-500">⚠️ Tidak ada dokumen — jangan approve</p>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-2 block">
                    Catatan (opsional, akan dikirim ke seller)
                  </label>
                  <textarea
                    value={notes[product.id] ?? ''}
                    onChange={(e) => setNotes((n) => ({ ...n, [product.id]: e.target.value }))}
                    placeholder="Tulis alasan rejection atau catatan untuk seller..."
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm
                      text-[#0B1D3A] placeholder:text-slate-400 focus:outline-none
                      focus:ring-2 focus:ring-[#0B1D3A] focus:border-transparent resize-none"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleReview(product.id, 'rejected')}
                    disabled={isPending}
                    className="flex-1 py-3 border-2 border-red-200 text-red-600 rounded-xl
                      font-semibold text-sm hover:bg-red-50 transition-all
                      disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {reviewingId === `${product.id}-rejected`
                      ? <Loader2 size={16} className="animate-spin" />
                      : <XCircle size={16} />
                    }
                    Tolak
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReview(product.id, 'approved')}
                    disabled={isPending || !product.documents?.length}
                    className="flex-1 py-3 bg-green-600 text-white rounded-xl
                      font-semibold text-sm hover:bg-green-700 transition-all
                      disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {reviewingId === `${product.id}-approved`
                      ? <Loader2 size={16} className="animate-spin" />
                      : <CheckCircle size={16} />
                    }
                    Approve
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}