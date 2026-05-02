'use client'

/**
 * components/auth/LoginForm.tsx
 *
 * Form login dengan dua mode:
 * 1. Password (default)
 * 2. PIN (muncul setelah user pernah login + punya PIN di device ini)
 */

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, KeyRound, LockKeyhole } from 'lucide-react'
import { login, loginWithPin } from '@/lib/actions/auth'
import { PinInput } from '@/components/auth/PinInput'
import { cn } from '@/lib/utils'

type LoginMode = 'password' | 'pin'

// Simpan userId di localStorage untuk PIN login
// (bukan data sensitif — hanya UUID untuk lookup)
const USER_ID_STORAGE_KEY = 'cukainaja_uid'
const HAS_PIN_STORAGE_KEY = 'cukainaja_has_pin'

export function LoginForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [mode, setMode] = useState<LoginMode>('password')
  const [savedUserId, setSavedUserId] = useState<string | null>(null)
  const [hasSavedPin, setHasSavedPin] = useState(false)

  const [form, setForm] = useState({ email: '', password: '', rememberMe: false })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pinError, setPinError] = useState<string | null>(null)

  // Cek apakah ada saved PIN session
  useEffect(() => {
    const uid = localStorage.getItem(USER_ID_STORAGE_KEY)
    const hasPin = localStorage.getItem(HAS_PIN_STORAGE_KEY) === 'true'
    if (uid && hasPin) {
      setSavedUserId(uid)
      setHasSavedPin(true)
      setMode('pin')
    }
  }, [])

  const redirectAfterLogin = (redirectPath: string) => {
    if (redirectPath.startsWith('http')) {
      window.location.href = redirectPath
    } else {
      router.push(redirectPath)
      router.refresh()
    }
  }

  // ─── Password Login ─────────────────────────────────────────────────────────

  const handlePasswordLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      const result = await login(
        { email: form.email, password: form.password },
        form.rememberMe
      )

      if (result.error) {
        setError(result.error)
        return
      }

      const { userId, hasPin, redirectPath } = result.data!

      // Simpan ke localStorage untuk PIN login next time
      localStorage.setItem(USER_ID_STORAGE_KEY, userId)
      if (hasPin) {
        localStorage.setItem(HAS_PIN_STORAGE_KEY, 'true')
      } else {
        localStorage.removeItem(HAS_PIN_STORAGE_KEY)
      }

      redirectAfterLogin(redirectPath)
    })
  }

  // ─── PIN Login ──────────────────────────────────────────────────────────────

  const handlePinComplete = (pin: string) => {
    if (!savedUserId) return
    setPinError(null)

    startTransition(async () => {
      const result = await loginWithPin(savedUserId, pin)

      if (result.error) {
        setPinError(result.error)
        return
      }

      redirectAfterLogin(result.data!.redirectPath)
    })
  }

  const handleSwitchToPassword = () => {
    setMode('password')
    setPinError(null)
    setError(null)
  }

  // ─── Render PIN Mode ─────────────────────────────────────────────────────────

  if (mode === 'pin' && hasSavedPin) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 bg-[#0B1D3A]/5 rounded-2xl flex items-center justify-center">
            <LockKeyhole className="text-[#0B1D3A]" size={24} />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-slate-700">Masuk dengan PIN</p>
            <p className="text-xs text-slate-400 mt-1">Masukkan 6 digit PIN kamu</p>
          </div>
        </div>

        <PinInput
          onComplete={handlePinComplete}
          disabled={isPending}
          error={pinError}
          autoSubmit
        />

        {isPending && (
          <div className="flex justify-center">
            <Loader2 className="animate-spin text-slate-400" size={20} />
          </div>
        )}

        <div className="text-center space-y-2">
          <button
            type="button"
            onClick={handleSwitchToPassword}
            className="text-sm text-slate-500 hover:text-[#0B1D3A] transition-colors"
          >
            Gunakan password
          </button>
          <br />
          <Link
            href="/forgot-password"
            className="text-sm text-slate-500 hover:text-[#0B1D3A] transition-colors"
          >
            Lupa PIN atau password?
          </Link>
        </div>
      </div>
    )
  }

  // ─── Render Password Mode ────────────────────────────────────────────────────

  return (
    <form onSubmit={handlePasswordLogin} className="space-y-5">
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
          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white
            text-[#0B1D3A] placeholder:text-slate-400 text-sm
            focus:outline-none focus:ring-2 focus:ring-[#0B1D3A] focus:border-transparent
            disabled:opacity-50 transition-shadow"
        />
      </div>

      {/* Password */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="password" className="block text-sm font-medium text-slate-700">
            Password
          </label>
          <Link
            href="/forgot-password"
            className="text-xs text-slate-500 hover:text-[#C8960C] transition-colors"
          >
            Lupa password?
          </Link>
        </div>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            placeholder="Password kamu"
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
      </div>

      {/* Remember me */}
      <label className="flex items-center gap-2.5 cursor-pointer group">
        <div className="relative">
          <input
            type="checkbox"
            className="sr-only"
            checked={form.rememberMe}
            onChange={(e) => setForm((f) => ({ ...f, rememberMe: e.target.checked }))}
          />
          <div
            className={cn(
              'w-5 h-5 rounded border-2 flex items-center justify-center transition-all',
              form.rememberMe
                ? 'bg-[#0B1D3A] border-[#0B1D3A]'
                : 'border-slate-300 group-hover:border-slate-400'
            )}
          >
            {form.rememberMe && (
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </div>
        <span className="text-sm text-slate-600">Ingat saya selama 30 hari</span>
      </label>

      {/* Error */}
      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
          <p className="text-red-600 text-sm">{error}</p>
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
          'Masuk'
        )}
      </button>

      {/* PIN option jika sebelumnya pernah setup */}
      {hasSavedPin && (
        <button
          type="button"
          onClick={() => setMode('pin')}
          className="w-full py-3 border border-slate-200 rounded-xl text-sm text-slate-600
            hover:border-slate-300 hover:bg-slate-50 transition-all
            flex items-center justify-center gap-2"
        >
          <KeyRound size={16} />
          Masuk dengan PIN
        </button>
      )}
    </form>
  )
}