'use client'
/**
 * components/auth/ResetPasswordForm.tsx
 */
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react'
import { resetPassword } from '@/lib/actions/auth'

export function ResetPasswordForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState({ password: '', confirm: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (form.password !== form.confirm) {
      setError('Konfirmasi password tidak cocok')
      return
    }

    startTransition(async () => {
      const result = await resetPassword(form.password)
      if (result.error) { setError(result.error); return }
      setSuccess(true)
      setTimeout(() => router.push('/login'), 2500)
    })
  }

  if (success) {
    return (
      <div className="text-center space-y-4 py-8">
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="text-green-500" size={32} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#0B1D3A]">Password Berhasil Diubah</h2>
          <p className="text-slate-500 text-sm mt-1">Mengalihkan ke halaman login...</p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* New password */}
      <div>
        <label htmlFor="new-password" className="block text-sm font-medium text-slate-700 mb-1.5">
          Password Baru
        </label>
        <div className="relative">
          <input
            id="new-password"
            type={showPassword ? 'text' : 'password'}
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            placeholder="Min. 8 karakter, huruf & angka"
            required
            disabled={isPending}
            className="w-full px-4 py-3 pr-11 rounded-xl border border-slate-200 text-[#0B1D3A]
              placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2
              focus:ring-[#0B1D3A] focus:border-transparent disabled:opacity-50"
          />
          <button type="button" onClick={() => setShowPassword(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>
      {/* Confirm */}
      <div>
        <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-700 mb-1.5">
          Konfirmasi Password
        </label>
        <input
          id="confirm-password"
          type={showPassword ? 'text' : 'password'}
          value={form.confirm}
          onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
          placeholder="Ulangi password baru"
          required
          disabled={isPending}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 text-[#0B1D3A]
            placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2
            focus:ring-[#0B1D3A] focus:border-transparent disabled:opacity-50"
        />
      </div>
      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}
      <button type="submit" disabled={isPending}
        className="w-full py-3.5 bg-[#0B1D3A] text-white rounded-xl font-semibold text-sm
          hover:bg-[#0B1D3A]/90 active:scale-[0.98] transition-all
          disabled:opacity-50 flex items-center justify-center gap-2">
        {isPending ? <><Loader2 size={16} className="animate-spin" /> Menyimpan...</> : 'Simpan Password Baru'}
      </button>
    </form>
  )
}