'use client'
/**
 * components/user/ProfileForm.tsx
 */
import { useState, useTransition } from 'react'
import { Loader2, Check } from 'lucide-react'
import { updateProfile } from '@/lib/actions/auth'

export function ProfileForm({ currentName }: { currentName: string }) {
  const [name, setName] = useState(currentName)
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaved(false)
    startTransition(async () => {
      const result = await updateProfile(name)
      if (result.error) { setError(result.error); return }
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="text-sm font-medium text-slate-700 mb-1.5 block">
          Nama Lengkap
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={isPending}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 text-[#0B1D3A]
            text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1D3A] focus:border-transparent
            disabled:opacity-50"
        />
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button type="submit" disabled={isPending || name === currentName}
        className="flex items-center gap-2 px-5 py-2.5 bg-[#0B1D3A] text-white rounded-xl
          text-sm font-semibold hover:bg-[#0B1D3A]/90 disabled:opacity-50 transition-all">
        {isPending ? <><Loader2 size={14} className="animate-spin" />Menyimpan...</>
         : saved ? <><Check size={14} />Tersimpan!</>
         : 'Simpan Perubahan'}
      </button>
    </form>
  )
}