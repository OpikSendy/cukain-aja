'use client'
/**
 * components/product/DocumentUpload.tsx
 *
 * Upload dokumen bea cukai ke private bucket.
 * Dokumen yang sudah diupload ditampilkan sebagai list dengan option hapus.
 */
import { useState, useRef, useCallback } from 'react'
import { FileText, Upload, Trash2, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import {
  uploadDocumentAction,
  deleteDocumentAction,
} from '@/lib/actions/uploads'
import { cn } from '@/lib/utils'
import type { Document, DocType } from '@/lib/types'

const DOC_TYPE_LABELS: Record<DocType, string> = {
  invoice:  'Invoice / Faktur',
  beacukai: 'Dokumen Bea Cukai',
  lainnya:  'Dokumen Lainnya',
}

const DOC_TYPE_DESCRIPTIONS: Record<DocType, string> = {
  invoice:  'Bukti pembelian atau faktur resmi',
  beacukai: 'Dokumen resmi dari Direktorat Bea Cukai',
  lainnya:  'Sertifikat, STNK, atau dokumen pendukung lain',
}

interface DocumentUploadProps {
  productId: string
  initialDocuments?: Document[]
  onChange?: (docs: Document[]) => void
}

interface DocUploadState {
  isUploading: boolean
  isDeleting: boolean
  error: string | null
}

export function DocumentUpload({
  productId,
  initialDocuments = [],
  onChange,
}: DocumentUploadProps) {
  const [documents, setDocuments] = useState<Document[]>(initialDocuments)
  const [uploadStates, setUploadStates] = useState<Record<DocType, DocUploadState>>({
    invoice:  { isUploading: false, isDeleting: false, error: null },
    beacukai: { isUploading: false, isDeleting: false, error: null },
    lainnya:  { isUploading: false, isDeleting: false, error: null },
  })

  const fileRefs = {
    invoice:  useRef<HTMLInputElement>(null),
    beacukai: useRef<HTMLInputElement>(null),
    lainnya:  useRef<HTMLInputElement>(null),
  }

  const setDocState = (type: DocType, patch: Partial<DocUploadState>) => {
    setUploadStates((prev) => ({
      ...prev,
      [type]: { ...prev[type], ...patch },
    }))
  }

  const handleUpload = useCallback(async (type: DocType, file: File) => {
    setDocState(type, { isUploading: true, error: null })

    try {
      const formData = new FormData()
      formData.append('file', file)

      const result = await uploadDocumentAction(productId, type, formData)

      if (result.error) {
        setDocState(type, { error: result.error, isUploading: false })
        return
      }

      // Refresh documents list
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: freshDocs } = await supabase
        .from('documents')
        .select('*')
        .eq('product_id', productId)

      const updated = freshDocs ?? documents
      setDocuments(updated)
      onChange?.(updated)
      setDocState(type, { isUploading: false, error: null })
    } catch {
      setDocState(type, { isUploading: false, error: 'Upload gagal. Coba lagi.' })
    }
  }, [productId, documents, onChange])

  const handleDelete = async (docId: string, type: DocType) => {
    setDocState(type, { isDeleting: true, error: null })
    const result = await deleteDocumentAction(docId)
    if (result.error) {
      setDocState(type, { isDeleting: false, error: result.error })
      return
    }
    const updated = documents.filter((d) => d.id !== docId)
    setDocuments(updated)
    onChange?.(updated)
    setDocState(type, { isDeleting: false })
  }

  const getDocByType = (type: DocType) =>
    documents.filter((d) => d.document_type === type)

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-slate-700">
          Dokumen Legal <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-slate-400 mt-0.5">
          Upload minimal 1 dokumen bea cukai sebelum submit produk untuk verifikasi.
        </p>
      </div>

      <div className="space-y-3">
        {(Object.keys(DOC_TYPE_LABELS) as DocType[]).map((type) => {
          const state = uploadStates[type]
          const existingDocs = getDocByType(type)
          const hasDoc = existingDocs.length > 0

          return (
            <div
              key={type}
              className={cn(
                'border rounded-xl p-4 transition-all',
                hasDoc ? 'border-green-200 bg-green-50/50' : 'border-slate-200 bg-white'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {/* Icon */}
                  <div className={cn(
                    'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                    hasDoc ? 'bg-green-100' : 'bg-slate-100'
                  )}>
                    {hasDoc
                      ? <CheckCircle className="text-green-600" size={18} />
                      : <FileText className="text-slate-400" size={18} />
                    }
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700">
                      {DOC_TYPE_LABELS[type]}
                    </p>
                    <p className="text-xs text-slate-400">{DOC_TYPE_DESCRIPTIONS[type]}</p>

                    {/* Existing docs */}
                    {existingDocs.map((doc) => (
                      <div key={doc.id} className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-slate-500 truncate">
                          Dokumen terupload ✓
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDelete(doc.id, type)}
                          disabled={state.isDeleting}
                          className="text-red-400 hover:text-red-600 transition-colors"
                        >
                          {state.isDeleting
                            ? <Loader2 size={13} className="animate-spin" />
                            : <Trash2 size={13} />
                          }
                        </button>
                      </div>
                    ))}

                    {/* Error */}
                    {state.error && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <AlertCircle size={12} className="text-red-500" />
                        <p className="text-xs text-red-500">{state.error}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Upload button */}
                <div>
                  <input
                    ref={fileRefs[type]}
                    type="file"
                    accept=".pdf,image/jpeg,image/jpg,image/png"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleUpload(type, file)
                      e.target.value = ''
                    }}
                    disabled={state.isUploading}
                  />
                  <button
                    type="button"
                    onClick={() => fileRefs[type].current?.click()}
                    disabled={state.isUploading}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                      'border disabled:opacity-50',
                      hasDoc
                        ? 'border-slate-200 text-slate-500 hover:border-slate-300'
                        : 'border-[#0B1D3A] text-[#0B1D3A] hover:bg-[#0B1D3A]/5'
                    )}
                  >
                    {state.isUploading ? (
                      <><Loader2 size={12} className="animate-spin" /> Upload...</>
                    ) : (
                      <><Upload size={12} /> {hasDoc ? 'Ganti' : 'Upload'}</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl">
        <AlertCircle size={14} className="text-blue-500 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-600 leading-relaxed">
          Dokumen disimpan secara private dan hanya dapat diakses oleh admin Cukain Aja
          untuk keperluan verifikasi. Format yang diterima: PDF, JPG, PNG. Maks 10MB.
        </p>
      </div>
    </div>
  )
}