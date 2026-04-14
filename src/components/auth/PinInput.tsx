'use client'

/**
 * components/auth/PinInput.tsx
 *
 * PIN input dengan keypad numerik.
 * Digunakan di: setup PIN, login dengan PIN, konfirmasi payment.
 *
 * Props:
 * - length: jumlah digit (default 6)
 * - onComplete: callback saat semua digit terisi
 * - onClear: callback saat reset
 * - disabled: disable input
 * - error: pesan error
 * - label: label di atas dots
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { Delete, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PinInputProps {
  length?: number
  onComplete: (pin: string) => void
  onClear?: () => void
  disabled?: boolean
  error?: string | null
  label?: string
  autoSubmit?: boolean
  className?: string
}

const KEYPAD = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['clear', '0', 'delete'],
] as const

export function PinInput({
  length = 6,
  onComplete,
  onClear,
  disabled = false,
  error,
  label,
  autoSubmit = true,
  className,
}: PinInputProps) {
  const [digits, setDigits] = useState<string[]>([])
  const [shake, setShake] = useState(false)

  // Shake animation saat ada error
  useEffect(() => {
    if (error) {
      setShake(true)
      setDigits([]) // Reset digits saat error
      const t = setTimeout(() => setShake(false), 500)
      return () => clearTimeout(t)
    }
  }, [error])

  const handleKey = useCallback(
    (key: string) => {
      if (disabled) return

      if (key === 'delete') {
        setDigits((prev) => prev.slice(0, -1))
        return
      }

      if (key === 'clear') {
        setDigits([])
        onClear?.()
        return
      }

      if (digits.length >= length) return

      const newDigits = [...digits, key]
      setDigits(newDigits)

      if (autoSubmit && newDigits.length === length) {
        onComplete(newDigits.join(''))
      }
    },
    [digits, length, disabled, autoSubmit, onComplete, onClear]
  )

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return
      if (e.key >= '0' && e.key <= '9') handleKey(e.key)
      if (e.key === 'Backspace') handleKey('delete')
      if (e.key === 'Escape') handleKey('clear')
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKey, disabled])

  return (
    <div className={cn('flex flex-col items-center gap-6', className)}>
      {/* Label */}
      {label && (
        <p className="text-sm font-medium text-slate-600 text-center">{label}</p>
      )}

      {/* PIN Dots */}
      <div
        className={cn(
          'flex gap-3 transition-transform',
          shake && 'animate-[shake_0.4s_ease-in-out]'
        )}
      >
        {Array.from({ length }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'w-4 h-4 rounded-full border-2 transition-all duration-200',
              i < digits.length
                ? 'bg-[#0B1D3A] border-[#0B1D3A] scale-110'
                : 'bg-transparent border-slate-300',
              error && 'border-red-400',
              disabled && 'opacity-50'
            )}
          />
        ))}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-red-500 text-sm text-center animate-fade-in">{error}</p>
      )}

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-[240px]">
        {KEYPAD.flat().map((key) => {
          const isSpecial = key === 'delete' || key === 'clear'

          return (
            <button
              key={key}
              type="button"
              onClick={() => handleKey(key)}
              disabled={disabled}
              className={cn(
                'h-14 rounded-2xl font-semibold text-lg transition-all duration-150',
                'active:scale-95 select-none',
                isSpecial
                  ? 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  : 'bg-[#0B1D3A]/5 text-[#0B1D3A] hover:bg-[#0B1D3A]/10',
                disabled && 'opacity-40 cursor-not-allowed'
              )}
            >
              {key === 'delete' ? (
                <Delete size={18} className="mx-auto" />
              ) : key === 'clear' ? (
                <RotateCcw size={16} className="mx-auto" />
              ) : (
                key
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}