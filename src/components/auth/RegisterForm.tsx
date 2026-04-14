'use client'

/**
 * components/auth/RegisterForm.tsx
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, CheckCircle2, User, Store } from 'lucide-react'
import { register } from '@/lib/actions/auth'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/lib/types'

type RoleOption = {
  value: Extract<UserRole, 'user' | 'seller'>
  label: string
  description: string
  icon: React.ReactNode
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    value: 'user',
    label: 'Pembeli',
    description: 'Beli & ikut lelang',
    icon: <User size={18} />,
  },
  {
    value: 'seller',
    label: 'Penjual',
    description: 'Jual barang bea cukai',
    icon: <Store size={18} />,
  },
]

// Password strength checker
function getPasswordStrength(password: string): {
  score: number
  label: string
  color: string
} {
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^a-zA-Z0-9]/.test(password)) score++

  if (score <= 1) return { score, label: 'Lemah', color: 'bg-red-400' }
  if (score <= 2) return { score, label: 'Cukup', color: 'bg-orange-400' }
  if (score <= 3) return { score, label: 'Kuat', color: 'bg-yellow-400' }
  return { score, label: 'Sangat Kuat', color: 'bg-green-500' }
}

export function RegisterForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user' as Extract<UserRole, 'user' | 'seller'>,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const passwordStrength = form.password ? getPasswordStrength(form.password) : null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      const result = await register(form)

      if (result.error) {
        setError(result.error)
        return
      }

      if (result.data?.requiresEmailVerification) {
        setSuccess(true)
      } else {
        // Auto-login (email confirmation disabled di Supabase)
        router.push('/setup-pin')
        router.refresh()
      }
    })
  }

  if (success) {
    return (
      <div className="text-center space-y-4 py-8">
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="text-green-500" size={32} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#0B1D3A]">Cek Email Kamu</h2>
          <p className="text-slate-500 text-sm mt-2">
            Kami kirim link konfirmasi ke{' '}
            <span className="font-medium text-[#0B1D3A]">{form.email}</span>.
            <br />
            Klik link tersebut untuk mengaktifkan akun.
          </p>
        </div>
        <p className="text-xs text-slate-400">
          Tidak ada email?{' '}
          <button
            type="button"
            className="text-[#0B1D3A] font-semibold hover:underline"
            onClick={() => {
              // resendVerificationEmail(form.email) — bisa ditambahkan
            }}
          >
            Kirim ulang
          </button>
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Role selector */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Daftar sebagai
        </label>
        <div className="grid grid-cols-2 gap-3">
          {ROLE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setForm((f) => ({ ...f, role: option.value }))}
              className={cn(
                'p-3 rounded-xl border-2 text-left transition-all duration-150',
                form.role === option.value
                  ? 'border-[#0B1D3A] bg-[#0B1D3A]/5'
                  : 'border-slate-200 hover:border-slate-300'
              )}
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center mb-2',
                  form.role === option.value
                    ? 'bg-[#0B1D3A] text-[#C8960C]'
                    : 'bg-slate-100 text-slate-500'
                )}
              >
                {option.icon}
              </div>
              <p
                className={cn(
                  'font-semibold text-sm',
                  form.role === option.value ? 'text-[#0B1D3A]' : 'text-slate-700'
                )}
              >
                {option.label}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{option.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">
          Nama Lengkap
        </label>
        <input
          id="name"
          type="text"
          autoComplete="name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Budi Santoso"
          required
          disabled={isPending}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-[#0B1D3A]
            placeholder:text-slate-400 text-sm
            focus:outline-none focus:ring-2 focus:ring-[#0B1D3A] focus:border-transparent
            disabled:opacity-50 transition-shadow"
        />
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          placeholder="budi@email.com"
          required
          disabled={isPending}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-[#0B1D3A]
            placeholder:text-slate-400 text-sm
            focus:outline-none focus:ring-2 focus:ring-[#0B1D3A] focus:border-transparent
            disabled:opacity-50 transition-shadow"
        />
      </div>

      {/* Password */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            placeholder="Min. 8 karakter"
            required
            disabled={isPending}
            className="w-full px-4 py-3 pr-11 rounded-xl border border-slate-200 bg-white
              text-[#0B1D3A] placeholder:text-slate-400 text-sm
              focus:outline-none focus:ring-2 focus:ring-[#0B1D3A] focus:border-transparent
              disabled:opacity-50 transition-shadow"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {/* Password strength bar */}
        {passwordStrength && (
          <div className="mt-2 space-y-1">
            <div className="flex gap-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'h-1 flex-1 rounded-full transition-all duration-300',
                    i < passwordStrength.score
                      ? passwordStrength.color
                      : 'bg-slate-100'
                  )}
                />
              ))}
            </div>
            <p className="text-xs text-slate-500">
              Kekuatan:{' '}
              <span
                className={cn(
                  'font-medium',
                  passwordStrength.score <= 1 && 'text-red-500',
                  passwordStrength.score === 2 && 'text-orange-500',
                  passwordStrength.score === 3 && 'text-yellow-600',
                  passwordStrength.score >= 4 && 'text-green-600'
                )}
              >
                {passwordStrength.label}
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Seller note */}
      {form.role === 'seller' && (
        <div className="px-4 py-3 bg-amber-50 border border-amber-100 rounded-xl">
          <p className="text-amber-700 text-xs leading-relaxed">
            <span className="font-semibold">Catatan Penjual:</span> Akun seller memerlukan
            persetujuan admin sebelum bisa mengupload produk. Proses verifikasi 1–2 hari kerja.
          </p>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full py-3.5 bg-[#0B1D3A] text-white rounded-xl font-semibold text-sm
          hover:bg-[#0B1D3A]/90 active:scale-[0.98] transition-all
          disabled:opacity-50 disabled:cursor-not-allowed
          flex items-center justify-center gap-2"
      >
        {isPending ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Memproses...
          </>
        ) : (
          'Buat Akun'
        )}
      </button>

      <p className="text-center text-xs text-slate-400">
        Dengan mendaftar, kamu menyetujui{' '}
        <Link href="/terms" className="text-[#0B1D3A] hover:underline">Syarat & Ketentuan</Link>
        {' '}dan{' '}
        <Link href="/privacy" className="text-[#0B1D3A] hover:underline">Kebijakan Privasi</Link>
        {' '}Cukain Aja.
      </p>
    </form>
  )
}