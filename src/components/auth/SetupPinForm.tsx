'use client'
/**
 * components/auth/SetupPinForm.tsx
 *
 * Setup PIN dengan dua langkah: masukkan PIN → konfirmasi PIN.
 */
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { setupPin } from '@/lib/actions/auth'
import { PinInput } from '@/components/auth/PinInput'

// localStorage key untuk PIN status
const HAS_PIN_KEY = 'cukainaja_has_pin'
const USER_ID_KEY = 'cukainaja_uid'

interface SetupPinFormProps {
  userId: string
  dashboardRoute: string
}

type Step = 'enter' | 'confirm' | 'success'

export function SetupPinForm({ userId, dashboardRoute }: SetupPinFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [step, setStep] = useState<Step>('enter')
  const [firstPin, setFirstPin] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleFirstPin = (pin: string) => {
    setFirstPin(pin)
    setStep('confirm')
    setError(null)
  }

  const handleConfirmPin = (confirmPin: string) => {
    setError(null)

    if (confirmPin !== firstPin) {
      setError('PIN tidak cocok. Coba lagi dari awal.')
      setFirstPin('')
      setStep('enter')
      return
    }

    startTransition(async () => {
      const result = await setupPin({ pin: confirmPin, confirmPin })

      if (result.error) {
        setError(result.error)
        setFirstPin('')
        setStep('enter')
        return
      }

      // Simpan ke localStorage untuk PIN login
      localStorage.setItem(HAS_PIN_KEY, 'true')
      localStorage.setItem(USER_ID_KEY, userId)

      setStep('success')
      setTimeout(() => router.push(dashboardRoute), 1800)
    })
  }

  if (step === 'success') {
    return (
      <div className="flex flex-col items-center gap-4 py-6">
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
          <CheckCircle2 className="text-green-500" size={32} />
        </div>
        <div className="text-center">
          <p className="font-semibold text-[#0B1D3A]">PIN berhasil dibuat!</p>
          <p className="text-slate-500 text-sm mt-1">Mengalihkan ke dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Step indicator */}
      <div className="flex items-center gap-2 justify-center mb-6">
        {(['enter', 'confirm'] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
              ${step === s || (step === 'confirm' && s === 'enter')
                ? 'bg-[#0B1D3A] text-white'
                : 'bg-slate-100 text-slate-400'}`}>
              {i + 1}
            </div>
            {i === 0 && <div className={`w-8 h-0.5 ${step === 'confirm' ? 'bg-[#0B1D3A]' : 'bg-slate-200'}`} />}
          </div>
        ))}
      </div>

      {step === 'enter' && (
        <PinInput
          label="Masukkan PIN baru kamu"
          onComplete={handleFirstPin}
          error={error}
          disabled={isPending}
        />
      )}

      {step === 'confirm' && (
        <PinInput
          label="Konfirmasi PIN kamu"
          onComplete={handleConfirmPin}
          error={error}
          disabled={isPending}
        />
      )}

      {isPending && (
        <div className="flex justify-center pt-4">
          <Loader2 className="animate-spin text-slate-400" size={20} />
        </div>
      )}
    </div>
  )
}