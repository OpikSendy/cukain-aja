'use client'
/**
 * components/auth/ForgotPasswordForm.tsx
 */
import { useState, useTransition } from 'react'
import { Loader2, MailCheck } from 'lucide-react'
import { forgotPassword } from '@/lib/actions/auth'

export function ForgotPasswordForm() {
  const [isPending, startTransition] = useTransition()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await forgotPassword(email)
      if (result.error) { setError(result.error); return }
      setSent(true)
    })
  }

  if (sent) {
    return (
      <div className="text-center space-y-4 py-8">
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
          <MailCheck className="text-blue-500" size={28} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#0B1D3A]">Email Terkirim</h2>
          <p className="text-slate-500 text-sm mt-2">
            Kalau email <span className="font-medium text-[#0B1D3A]">{email}</span> terdaftar,
            kamu akan menerima link reset password dalam beberapa menit.
          </p>
        </div>
        <p className="text-xs text-slate-400">Cek folder spam kalau tidak muncul.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
          Email Akun
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="budi@email.com"
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
      <button
        type="submit"
        disabled={isPending}
        className="w-full py-3.5 bg-[#0B1D3A] text-white rounded-xl font-semibold text-sm
          hover:bg-[#0B1D3A]/90 active:scale-[0.98] transition-all
          disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isPending ? <><Loader2 size={16} className="animate-spin" /> Mengirim...</> : 'Kirim Link Reset'}
      </button>
    </form>
  )
}