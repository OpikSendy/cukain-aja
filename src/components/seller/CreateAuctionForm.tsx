/**
 * components/seller/CreateAuctionForm.tsx
 */
'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Gavel, Info } from 'lucide-react'
import { createAuction } from '@/lib/actions/auctions'
import { formatRupiah } from '@/lib/utils/format'
import { notify } from '@/components/ui/Toaster'

interface CreateAuctionFormProps {
    productId: string
    productTitle: string
}

export function CreateAuctionForm({ productId, productTitle }: CreateAuctionFormProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    const [form, setForm] = useState({
        startPrice: '',
        startDate: '',
        startTime: '',
        endDate: '',
        endTime: '',
    })
    const [error, setError] = useState<string | null>(null)

    // Calculate duration
    const getStartDateTime = () => {
        if (!form.startDate || !form.startTime) return null
        return new Date(`${form.startDate}T${form.startTime}`)
    }
    const getEndDateTime = () => {
        if (!form.endDate || !form.endTime) return null
        return new Date(`${form.endDate}T${form.endTime}`)
    }

    const startDt = getStartDateTime()
    const endDt = getEndDateTime()
    const durationHours = startDt && endDt
        ? Math.round((endDt.getTime() - startDt.getTime()) / (1000 * 60 * 60))
        : null

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        const startTime = getStartDateTime()
        const endTime = getEndDateTime()
        const price = parseFloat(form.startPrice)

        if (!startTime || !endTime || isNaN(price)) {
            setError('Lengkapi semua field')
            return
        }

        startTransition(async () => {
            const result = await createAuction({
                productId,
                startPrice: price,
                startTime,
                endTime,
            })

            if (result.error) {
                setError(result.error)
                notify.error('Gagal membuat lelang', result.error)
                return
            }

            notify.success('Lelang berhasil dibuat! 🎉')
            router.push('/seller/auctions')
            router.refresh()
        })
    }

    // Min datetime: now + 30 menit
    const minDateTime = new Date(Date.now() + 30 * 60 * 1000)
        .toISOString().slice(0, 16)

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
            {/* Product preview */}
            <div className="p-4 bg-[#0B1D3A]/3 border border-[#0B1D3A]/10 rounded-xl">
                <p className="text-xs text-slate-400 mb-1">Produk yang akan dilelang</p>
                <p className="font-semibold text-[#0B1D3A] text-sm">{productTitle}</p>
            </div>

            {/* Start price */}
            <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                    Harga Awal Lelang <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-semibold">Rp</span>
                    <input
                        type="number"
                        value={form.startPrice}
                        onChange={e => setForm(f => ({ ...f, startPrice: e.target.value }))}
                        placeholder="500000"
                        min={1000}
                        required
                        disabled={isPending}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-[#0B1D3A]
              text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1D3A] focus:border-transparent
              disabled:opacity-50"
                    />
                </div>
                {form.startPrice && !isNaN(parseFloat(form.startPrice)) && (
                    <p className="text-xs text-slate-500 mt-1">{formatRupiah(parseFloat(form.startPrice))}</p>
                )}
            </div>

            {/* Start time */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                        Tanggal Mulai <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="date"
                        value={form.startDate}
                        onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                        min={minDateTime.slice(0, 10)}
                        required
                        disabled={isPending}
                        className="w-full px-3 py-3 rounded-xl border border-slate-200 text-[#0B1D3A]
              text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1D3A] disabled:opacity-50"
                    />
                </div>
                <div>
                    <label className="text-sm font-medium text-slate-700 mb-1.5 block">Jam Mulai <span className="text-red-500">*</span></label>
                    <input
                        type="time"
                        value={form.startTime}
                        onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                        required
                        disabled={isPending}
                        className="w-full px-3 py-3 rounded-xl border border-slate-200 text-[#0B1D3A]
              text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1D3A] disabled:opacity-50"
                    />
                </div>
            </div>

            {/* End time */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                        Tanggal Selesai <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="date"
                        value={form.endDate}
                        onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                        min={form.startDate || minDateTime.slice(0, 10)}
                        required
                        disabled={isPending}
                        className="w-full px-3 py-3 rounded-xl border border-slate-200 text-[#0B1D3A]
              text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1D3A] disabled:opacity-50"
                    />
                </div>
                <div>
                    <label className="text-sm font-medium text-slate-700 mb-1.5 block">Jam Selesai <span className="text-red-500">*</span></label>
                    <input
                        type="time"
                        value={form.endTime}
                        onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                        required
                        disabled={isPending}
                        className="w-full px-3 py-3 rounded-xl border border-slate-200 text-[#0B1D3A]
              text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1D3A] disabled:opacity-50"
                    />
                </div>
            </div>

            {/* Duration preview */}
            {durationHours !== null && (
                <div className={`flex items-center gap-2 p-3 rounded-xl text-xs font-medium
          ${durationHours >= 1 && durationHours <= 720
                        ? 'bg-green-50 border border-green-100 text-green-700'
                        : 'bg-red-50 border border-red-100 text-red-600'}`}>
                    <Info size={14} />
                    {durationHours >= 1 && durationHours <= 720
                        ? `Durasi lelang: ${durationHours} jam (${Math.round(durationHours / 24)} hari)`
                        : durationHours < 1
                            ? 'Durasi minimum 1 jam'
                            : 'Durasi maksimum 30 hari'
                    }
                </div>
            )}

            {error && (
                <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
                    <p className="text-red-600 text-sm">{error}</p>
                </div>
            )}

            <button type="submit" disabled={isPending}
                className="w-full py-4 bg-[#C8960C] text-[#0B1D3A] rounded-2xl font-bold text-sm
          hover:bg-[#C8960C]/90 active:scale-[0.98] transition-all
          disabled:opacity-50 flex items-center justify-center gap-2">
                {isPending
                    ? <><Loader2 size={16} className="animate-spin" />Membuat Lelang...</>
                    : <><Gavel size={16} />Buat Lelang</>
                }
            </button>
        </form>
    )
}