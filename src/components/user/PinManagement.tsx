'use client'
/**
 * components/user/PinManagement.tsx
 *
 * Komponen untuk setup, ganti, dan hapus PIN dari halaman profil.
 */
import { useState } from 'react'
import { KeyRound, Trash2, RefreshCw } from 'lucide-react'
import { PinInput } from '@/components/auth/PinInput'
import { SetupPinForm } from '@/components/auth/SetupPinForm'
import { changePin, removePin } from '@/lib/actions/auth'

interface PinManagementProps {
  hasPin: boolean
  userId: string
}

type ActiveModal = null | 'setup' | 'change' | 'remove'

export function PinManagement({ hasPin, userId }: PinManagementProps) {
  const [modal, setModal] = useState<ActiveModal>(null)
  const [step, setStep] = useState<'verify-old' | 'enter-new' | 'confirm-new' | 'done'>('verify-old')
  const [oldPin, setOldPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [hasPinState, setHasPinState] = useState(hasPin)

  const resetModal = () => {
    setModal(null)
    setStep('verify-old')
    setOldPin('')
    setNewPin('')
    setError(null)
  }

  // ─── Change PIN flow ─────────────────────────────────────────────────────────
  const handleChangeStep1 = (pin: string) => {
    setOldPin(pin)
    setStep('enter-new')
    setError(null)
  }

  const handleChangeStep2 = (pin: string) => {
    setNewPin(pin)
    setStep('confirm-new')
    setError(null)
  }

  const handleChangeStep3 = async (confirm: string) => {
    setError(null)
    const result = await changePin(oldPin, newPin, confirm)
    if (result.error) {
      setError(result.error)
      setStep('verify-old')
      setOldPin('')
      setNewPin('')
      return
    }
    setStep('done')
    setTimeout(resetModal, 1500)
  }

  // ─── Remove PIN flow ─────────────────────────────────────────────────────────
  const handleRemove = async (pin: string) => {
    setError(null)
    const result = await removePin(pin)
    if (result.error) { setError(result.error); return }
    setHasPinState(false)
    resetModal()
  }

  return (
    <>
      {/* Buttons */}
      <div className="flex flex-wrap gap-2">
        {!hasPinState ? (
          <button onClick={() => setModal('setup')}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#0B1D3A] text-white
              rounded-xl text-sm font-semibold hover:bg-[#0B1D3A]/90 transition-colors">
            <KeyRound size={15} />
            Setup PIN
          </button>
        ) : (
          <>
            <button onClick={() => { setModal('change'); setStep('verify-old') }}
              className="flex items-center gap-2 px-4 py-2.5 border border-slate-200
                text-slate-600 rounded-xl text-sm font-medium hover:border-slate-300 transition-colors">
              <RefreshCw size={14} />
              Ganti PIN
            </button>
            <button onClick={() => { setModal('remove'); setStep('verify-old') }}
              className="flex items-center gap-2 px-4 py-2.5 border border-red-100
                text-red-500 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors">
              <Trash2 size={14} />
              Hapus PIN
            </button>
          </>
        )}
      </div>

      {/* Modal overlay */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
          onClick={resetModal}>
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-[#0B1D3A]/5 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <KeyRound className="text-[#0B1D3A]" size={22} />
              </div>
              <h3 className="font-bold text-[#0B1D3A]">
                {modal === 'setup' && 'Setup PIN Baru'}
                {modal === 'change' && (
                  step === 'verify-old' ? 'Masukkan PIN Lama'
                  : step === 'enter-new' ? 'Masukkan PIN Baru'
                  : step === 'confirm-new' ? 'Konfirmasi PIN Baru'
                  : 'PIN Berhasil Diubah ✓'
                )}
                {modal === 'remove' && 'Konfirmasi Hapus PIN'}
              </h3>
              {modal === 'remove' && (
                <p className="text-xs text-slate-400 mt-1">Masukkan PIN saat ini untuk konfirmasi.</p>
              )}
            </div>

            {modal === 'setup' && (
              <SetupPinForm userId={userId} dashboardRoute="/user/profile" />
            )}

            {modal === 'change' && step === 'verify-old' && (
              <PinInput label="PIN lama" onComplete={handleChangeStep1} error={error} />
            )}
            {modal === 'change' && step === 'enter-new' && (
              <PinInput label="PIN baru (6 digit)" onComplete={handleChangeStep2} />
            )}
            {modal === 'change' && step === 'confirm-new' && (
              <PinInput label="Ulangi PIN baru" onComplete={handleChangeStep3} error={error} />
            )}
            {modal === 'change' && step === 'done' && (
              <div className="text-center py-4">
                <p className="text-green-600 font-semibold">PIN berhasil diubah ✓</p>
              </div>
            )}

            {modal === 'remove' && (
              <PinInput label="Masukkan PIN saat ini" onComplete={handleRemove} error={error} />
            )}

            <button onClick={resetModal}
              className="w-full mt-4 py-2.5 text-sm text-slate-400 hover:text-slate-600 transition-colors">
              Batal
            </button>
          </div>
        </div>
      )}
    </>
  )
}