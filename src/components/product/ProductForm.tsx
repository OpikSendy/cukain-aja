'use client'
/**
 * components/product/ProductForm.tsx
 *
 * Form untuk create dan edit produk seller.
 * Flow create: isi form → save draft → upload images → upload docs → submit.
 */
import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Save, Send, Info } from 'lucide-react'
import { createProduct, updateProduct, submitProductForVerification } from '@/lib/actions/products'
import { ImageUpload } from '@/components/product/ImageUpload'
import { DocumentUpload } from '@/components/product/DocumentUpload'
import { cn } from '@/lib/utils'
import { formatRupiah } from '@/lib/utils/format'
import type { Product, ProductWithImages, Category, Document } from '@/lib/types'

interface ProductFormProps {
  /** Kalau ada, mode edit. Kalau tidak, mode create. */
  product?: ProductWithImages & { documents?: Document[] }
  categories: Category[]
  mode: 'create' | 'edit'
}

interface FormState {
  title: string
  description: string
  price: string
  type: 'fixed' | 'auction'
  categoryIds: string[]
}

export function ProductForm({ product, categories, mode }: ProductFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [savedProductId, setSavedProductId] = useState<string | null>(
    product?.id ?? null
  )
  const [form, setForm] = useState<FormState>({
    title: product?.title ?? '',
    description: product?.description ?? '',
    price: product?.price?.toString() ?? '',
    type: product?.type ?? 'fixed',
    categoryIds: [],  // akan diisi dari product_categories kalau mode edit
  })
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [canSubmit, setCanSubmit] = useState(false)

  // Cek apakah bisa submit (ada foto + ada dokumen)
  const checkCanSubmit = (hasImages: boolean, hasDocs: boolean) => {
    setCanSubmit(hasImages && hasDocs && !!savedProductId)
  }

  const handleSaveDraft = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      if (mode === 'create') {
        const result = await createProduct({
          title: form.title,
          description: form.description,
          price: form.type === 'fixed' ? parseFloat(form.price) : 0,
          type: form.type,
          categoryIds: form.categoryIds,
        })

        if (result.error) { setError(result.error); return }
        setSavedProductId(result.data!.id)
        setSaved(true)
      } else if (product) {
        const result = await updateProduct(product.id, {
          title: form.title,
          description: form.description,
          price: form.type === 'fixed' ? parseFloat(form.price) : undefined,
        })
        if (result.error) { setError(result.error); return }
        setSaved(true)
      }
    })
  }

  const handleSubmitForVerification = () => {
    if (!savedProductId) return
    setError(null)

    startTransition(async () => {
      const result = await submitProductForVerification(savedProductId)
      if (result.error) { setError(result.error); return }
      router.push('/seller/products?submitted=true')
      router.refresh()
    })
  }

  const isFixed = form.type === 'fixed'

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* ─ Step indicator ─ */}
      <div className="flex items-center gap-0">
        {['Informasi Produk', 'Foto', 'Dokumen', 'Submit'].map((step, i) => {
          const isDone =
            (i === 0 && saved) ||
            (i === 1 && (product?.product_images?.length ?? 0) > 0) ||
            (i === 2 && (product?.documents?.length ?? 0) > 0)
          const isCurrent = i === 0 || (i === 1 && saved) || (i === 2 && saved) || (i === 3 && canSubmit)

          return (
            <div key={step} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1">
                <div className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                  isDone ? 'bg-green-500 text-white' :
                  isCurrent ? 'bg-[#0B1D3A] text-white' :
                  'bg-slate-100 text-slate-400'
                )}>
                  {isDone ? '✓' : i + 1}
                </div>
                <span className="text-[10px] text-slate-500 whitespace-nowrap hidden sm:block">{step}</span>
              </div>
              {i < 3 && <div className={cn('h-0.5 flex-1 mx-1 transition-colors', isDone ? 'bg-green-300' : 'bg-slate-100')} />}
            </div>
          )
        })}
      </div>

      {/* ─ Step 1: Informasi ─ */}
      <form onSubmit={handleSaveDraft} className="space-y-6">
        <div className="bg-white border border-slate-100 rounded-2xl p-6 space-y-5">
          <h2 className="text-base font-semibold text-[#0B1D3A]">Informasi Produk</h2>

          {/* Tipe produk */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">Tipe Penjualan</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'fixed', label: 'Harga Tetap', desc: 'Pembeli langsung checkout' },
                { value: 'auction', label: 'Lelang', desc: 'Pembeli ikut bidding' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, type: opt.value as 'fixed' | 'auction' }))}
                  disabled={!!savedProductId} // tidak bisa ubah tipe setelah disimpan
                  className={cn(
                    'p-3 rounded-xl border-2 text-left transition-all',
                    form.type === opt.value
                      ? 'border-[#0B1D3A] bg-[#0B1D3A]/5'
                      : 'border-slate-200 hover:border-slate-300',
                    savedProductId && 'opacity-60 cursor-not-allowed'
                  )}
                >
                  <p className={cn('text-sm font-semibold', form.type === opt.value ? 'text-[#0B1D3A]' : 'text-slate-700')}>
                    {opt.label}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Judul */}
          <div>
            <label htmlFor="title" className="text-sm font-medium text-slate-700 mb-1.5 block">
              Nama Produk <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Contoh: iPhone 14 Pro Max 256GB Space Black"
              required
              maxLength={200}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-[#0B1D3A]
                placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2
                focus:ring-[#0B1D3A] focus:border-transparent"
            />
            <p className="text-xs text-slate-400 mt-1 text-right">{form.title.length}/200</p>
          </div>

          {/* Deskripsi */}
          <div>
            <label htmlFor="description" className="text-sm font-medium text-slate-700 mb-1.5 block">
              Deskripsi <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Jelaskan kondisi barang, kelengkapan, asal usul, dan informasi relevan lainnya..."
              required
              rows={5}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-[#0B1D3A]
                placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2
                focus:ring-[#0B1D3A] focus:border-transparent resize-none"
            />
          </div>

          {/* Harga (hanya untuk fixed) */}
          {isFixed && (
            <div>
              <label htmlFor="price" className="text-sm font-medium text-slate-700 mb-1.5 block">
                Harga <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium">
                  Rp
                </span>
                <input
                  id="price"
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  placeholder="0"
                  required={isFixed}
                  min={1000}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-[#0B1D3A]
                    placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2
                    focus:ring-[#0B1D3A] focus:border-transparent"
                />
              </div>
              {form.price && !isNaN(parseFloat(form.price)) && (
                <p className="text-xs text-slate-500 mt-1">
                  {formatRupiah(parseFloat(form.price))}
                </p>
              )}
            </div>
          )}

          {form.type === 'auction' && (
            <div className="flex items-start gap-2 p-3 bg-purple-50 border border-purple-100 rounded-xl">
              <Info size={14} className="text-purple-500 mt-0.5 shrink-0" />
              <p className="text-xs text-purple-600">
                Untuk produk lelang, harga awal akan diset saat kamu membuat sesi lelang
                setelah produk ini diapprove admin.
              </p>
            </div>
          )}

          {/* Kategori */}
          {categories.length > 0 && (
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Kategori <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => {
                  const isSelected = form.categoryIds.includes(cat.id)
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setForm((f) => ({
                        ...f,
                        categoryIds: isSelected
                          ? f.categoryIds.filter((id) => id !== cat.id)
                          : [...f.categoryIds, cat.id],
                      }))}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                        isSelected
                          ? 'bg-[#0B1D3A] text-white border-[#0B1D3A]'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                      )}
                    >
                      {cat.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Save Draft button */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full py-3.5 border-2 border-[#0B1D3A] text-[#0B1D3A] rounded-xl
            font-semibold text-sm hover:bg-[#0B1D3A]/5 active:scale-[0.98] transition-all
            disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isPending ? (
            <><Loader2 size={16} className="animate-spin" /> Menyimpan...</>
          ) : (
            <><Save size={16} /> {saved ? 'Simpan Perubahan' : 'Simpan sebagai Draft'}</>
          )}
        </button>
      </form>

      {/* ─ Step 2: Images (only after saved) ─ */}
      {savedProductId && (
        <div className="bg-white border border-slate-100 rounded-2xl p-6">
          <h2 className="text-base font-semibold text-[#0B1D3A] mb-5">Foto Produk</h2>
          <ImageUpload
            productId={savedProductId}
            initialImages={product?.product_images}
            onChange={(imgs) => checkCanSubmit(imgs.length > 0, (product?.documents?.length ?? 0) > 0)}
          />
        </div>
      )}

      {/* ─ Step 3: Documents (only after saved) ─ */}
      {savedProductId && (
        <div className="bg-white border border-slate-100 rounded-2xl p-6">
          <h2 className="text-base font-semibold text-[#0B1D3A] mb-5">Dokumen Legal</h2>
          <DocumentUpload
            productId={savedProductId}
            initialDocuments={product?.documents}
            onChange={(docs) => checkCanSubmit((product?.product_images?.length ?? 0) > 0, docs.length > 0)}
          />
        </div>
      )}

      {/* ─ Step 4: Submit ─ */}
      {savedProductId && (
        <div className="bg-[#0B1D3A]/3 border border-[#0B1D3A]/10 rounded-2xl p-6 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-[#0B1D3A]">Submit untuk Verifikasi</h2>
            <p className="text-sm text-slate-500 mt-1">
              Setelah submit, admin akan mereview produk dan dokumen kamu dalam 1-2 hari kerja.
            </p>
          </div>

          <ul className="space-y-1.5">
            {[
              ['Informasi produk lengkap', saved],
              ['Minimal 1 foto produk', (product?.product_images?.length ?? 0) > 0],
              ['Minimal 1 dokumen bea cukai', (product?.documents?.length ?? 0) > 0],
            ].map(([label, done]) => (
              <li key={label as string} className="flex items-center gap-2 text-sm">
                <span className={cn('w-4 h-4 rounded-full flex items-center justify-center text-[10px]',
                  done ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-400'
                )}>
                  {done ? '✓' : '○'}
                </span>
                <span className={done ? 'text-slate-700' : 'text-slate-400'}>{label as string}</span>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={handleSubmitForVerification}
            disabled={!canSubmit || isPending}
            className="w-full py-3.5 bg-[#C8960C] text-white rounded-xl font-semibold text-sm
              hover:bg-[#C8960C]/90 active:scale-[0.98] transition-all
              disabled:opacity-40 disabled:cursor-not-allowed
              flex items-center justify-center gap-2"
          >
            {isPending ? (
              <><Loader2 size={16} className="animate-spin" /> Mengirim...</>
            ) : (
              <><Send size={16} /> Submit untuk Verifikasi</>
            )}
          </button>
        </div>
      )}
    </div>
  )
}