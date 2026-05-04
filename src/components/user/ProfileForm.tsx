'use client'
/**
 * components/user/ProfileForm.tsx
 */
import { useState, useTransition } from 'react'
import { Loader2, Check } from 'lucide-react'
import { updateProfile } from '@/lib/actions/auth'

export function ProfileForm({ initialData }: { initialData: { name: string, phone?: string, address?: string, city?: string, province?: string, postal_code?: string } }) {
  const [formData, setFormData] = useState({
    name: initialData.name || '',
    phone: initialData.phone || '',
    address: initialData.address || '',
    city: initialData.city || '',
    province: initialData.province || '',
    postal_code: initialData.postal_code || '',
  })
  
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaved(false)
    startTransition(async () => {
      const result = await updateProfile(formData)
      if (result.error) { setError(result.error); return }
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  const hasChanges = 
    formData.name !== initialData.name ||
    formData.phone !== (initialData.phone || '') ||
    formData.address !== (initialData.address || '') ||
    formData.city !== (initialData.city || '') ||
    formData.province !== (initialData.province || '') ||
    formData.postal_code !== (initialData.postal_code || '')

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
            <label htmlFor="name" className="text-sm font-medium text-slate-700 mb-1.5 block">
            Nama Lengkap
            </label>
            <input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            required
            disabled={isPending}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-[#0B1D3A]
                text-sm focus:outline-none focus:ring-2 focus:ring-[#C8960C] focus:border-transparent
                disabled:opacity-50"
            />
        </div>

        <div>
            <label htmlFor="phone" className="text-sm font-medium text-slate-700 mb-1.5 block">
            Nomor HP
            </label>
            <input
            id="phone"
            name="phone"
            type="text"
            value={formData.phone}
            onChange={handleChange}
            disabled={isPending}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-[#0B1D3A]
                text-sm focus:outline-none focus:ring-2 focus:ring-[#C8960C] focus:border-transparent
                disabled:opacity-50"
            />
        </div>

        <div className="md:col-span-2">
            <label htmlFor="address" className="text-sm font-medium text-slate-700 mb-1.5 block">
            Alamat Lengkap
            </label>
            <textarea
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            disabled={isPending}
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-[#0B1D3A]
                text-sm focus:outline-none focus:ring-2 focus:ring-[#C8960C] focus:border-transparent
                disabled:opacity-50 resize-none"
            />
        </div>

        <div>
            <label htmlFor="city" className="text-sm font-medium text-slate-700 mb-1.5 block">
            Kota / Kabupaten
            </label>
            <input
            id="city"
            name="city"
            type="text"
            value={formData.city}
            onChange={handleChange}
            disabled={isPending}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-[#0B1D3A]
                text-sm focus:outline-none focus:ring-2 focus:ring-[#C8960C] focus:border-transparent
                disabled:opacity-50"
            />
        </div>

        <div>
            <label htmlFor="province" className="text-sm font-medium text-slate-700 mb-1.5 block">
            Provinsi
            </label>
            <input
            id="province"
            name="province"
            type="text"
            value={formData.province}
            onChange={handleChange}
            disabled={isPending}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-[#0B1D3A]
                text-sm focus:outline-none focus:ring-2 focus:ring-[#C8960C] focus:border-transparent
                disabled:opacity-50"
            />
        </div>

        <div>
            <label htmlFor="postal_code" className="text-sm font-medium text-slate-700 mb-1.5 block">
            Kode Pos
            </label>
            <input
            id="postal_code"
            name="postal_code"
            type="text"
            value={formData.postal_code}
            onChange={handleChange}
            disabled={isPending}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-[#0B1D3A]
                text-sm focus:outline-none focus:ring-2 focus:ring-[#C8960C] focus:border-transparent
                disabled:opacity-50"
            />
        </div>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}
      
      <div className="pt-2">
        <button type="submit" disabled={isPending || !hasChanges}
            className="flex items-center gap-2 px-6 py-3 bg-[#0B1D3A] text-white rounded-xl
            text-sm font-semibold hover:bg-[#0B1D3A]/90 disabled:opacity-50 transition-all">
            {isPending ? <><Loader2 size={16} className="animate-spin" />Menyimpan...</>
            : saved ? <><Check size={16} />Tersimpan!</>
            : 'Simpan Perubahan'}
        </button>
      </div>
    </form>
  )
}