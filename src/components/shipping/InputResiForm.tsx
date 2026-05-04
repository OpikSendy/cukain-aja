'use client'

/**
 * components/shipping/InputResiForm.tsx
 *
 * Form untuk admin input nomor resi pengiriman.
 * Digunakan di halaman /admin/orders/[id]
 */

import { useState, useTransition } from 'react'
import { Truck, CheckCircle2, AlertCircle } from 'lucide-react'
import { createShipment, updateShipmentStatus } from '@/lib/actions/shipping'
import { COURIER_LIST } from '@/constants/config'
import type { CourierType } from '@/constants/config'
import type { ShipmentData } from '@/lib/actions/shipping'
import type { ShipmentStatus } from '@/lib/utils/tracking'
import { getShipmentStatusLabel, SHIPMENT_STATUS_STEPS } from '@/lib/utils/tracking'

interface InputResiFormProps {
  orderId: string
  existingShipment: ShipmentData | null
  onSuccess?: (shipment: ShipmentData) => void
}

export function InputResiForm({ orderId, existingShipment, onSuccess }: InputResiFormProps) {
  const [courier, setCourier] = useState<CourierType>(
    (existingShipment?.courier as CourierType) ?? 'jne'
  )
  const [trackingNumber, setTrackingNumber] = useState(existingShipment?.tracking_number ?? '')
  const [estimatedDelivery, setEstimatedDelivery] = useState(existingShipment?.estimated_delivery ?? '')
  const [notes, setNotes] = useState(existingShipment?.notes ?? '')
  const [newStatus, setNewStatus] = useState<ShipmentStatus>(
    (existingShipment?.status as ShipmentStatus) ?? 'processing'
  )
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  const isUpdate = !!existingShipment

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setResult(null)

    startTransition(async () => {
      if (isUpdate) {
        // Update status pengiriman
        const res = await updateShipmentStatus(existingShipment.id, newStatus, notes || undefined)
        if (res.error) {
          setResult({ type: 'error', message: res.error })
        } else {
          setResult({ type: 'success', message: 'Status pengiriman berhasil diperbarui!' })
          if (res.data && onSuccess) onSuccess(res.data)
        }
      } else {
        // Buat shipment baru
        const res = await createShipment({
          orderId,
          courier,
          trackingNumber,
          estimatedDelivery: estimatedDelivery || undefined,
          notes: notes || undefined,
        })
        if (res.error) {
          setResult({ type: 'error', message: res.error })
        } else {
          setResult({ type: 'success', message: 'Resi berhasil diinput! Order status diubah ke "Dikirim".' })
          if (res.data && onSuccess) onSuccess(res.data)
        }
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!isUpdate ? (
        <>
          {/* Pilih Kurir */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
              Kurir Pengiriman
            </label>
            <div className="grid grid-cols-3 gap-2">
              {COURIER_LIST.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCourier(c.id as CourierType)}
                  className={`py-2.5 px-3 rounded-xl border-2 text-xs font-bold transition-all ${
                    courier === c.id
                      ? 'border-[#0B1D3A] bg-[#0B1D3A] text-white'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                  style={courier === c.id ? {} : { borderColor: `${c.color}40`, color: c.color }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Nomor Resi */}
          <div>
            <label htmlFor="resi-input" className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
              Nomor Resi Kurir <span className="text-red-500">*</span>
            </label>
            <input
              id="resi-input"
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value.toUpperCase())}
              placeholder="Contoh: 1234567890"
              required
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono
                focus:outline-none focus:ring-2 focus:ring-[#0B1D3A]/20 focus:border-[#0B1D3A]
                placeholder:text-slate-300 transition-all"
            />
          </div>

          {/* Estimasi Tiba */}
          <div>
            <label htmlFor="estimated-delivery" className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
              Estimasi Tiba (Opsional)
            </label>
            <input
              id="estimated-delivery"
              type="date"
              value={estimatedDelivery}
              onChange={(e) => setEstimatedDelivery(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm
                focus:outline-none focus:ring-2 focus:ring-[#0B1D3A]/20 focus:border-[#0B1D3A] transition-all"
            />
          </div>
        </>
      ) : (
        /* Update status */
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
            Update Status Pengiriman
          </label>
          <div className="space-y-2">
            {SHIPMENT_STATUS_STEPS.map((step) => (
              <label
                key={step}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all ${
                  newStatus === step
                    ? 'border-[#0B1D3A] bg-[#0B1D3A]/5'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="status"
                  value={step}
                  checked={newStatus === step}
                  onChange={() => setNewStatus(step)}
                  className="sr-only"
                />
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  newStatus === step ? 'border-[#0B1D3A]' : 'border-slate-300'
                }`}>
                  {newStatus === step && (
                    <div className="w-2 h-2 rounded-full bg-[#0B1D3A]" />
                  )}
                </div>
                <span className={`text-sm font-medium ${newStatus === step ? 'text-[#0B1D3A]' : 'text-slate-600'}`}>
                  {getShipmentStatusLabel(step)}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Catatan */}
      <div>
        <label htmlFor="notes-input" className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
          Catatan (Opsional)
        </label>
        <textarea
          id="notes-input"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Catatan untuk pembeli..."
          rows={2}
          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm resize-none
            focus:outline-none focus:ring-2 focus:ring-[#0B1D3A]/20 focus:border-[#0B1D3A]
            placeholder:text-slate-300 transition-all"
        />
      </div>

      {/* Result message */}
      {result && (
        <div className={`flex items-start gap-2 rounded-xl px-4 py-3 text-sm ${
          result.type === 'success'
            ? 'bg-green-50 border border-green-200 text-green-700'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {result.type === 'success'
            ? <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
            : <AlertCircle size={16} className="shrink-0 mt-0.5" />
          }
          {result.message}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending || (!isUpdate && !trackingNumber.trim())}
        className="w-full py-3 rounded-xl bg-[#0B1D3A] text-white text-sm font-bold
          hover:bg-[#1a3a6e] transition-colors disabled:opacity-50
          flex items-center justify-center gap-2"
      >
        {isPending ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Menyimpan...
          </>
        ) : (
          <>
            <Truck size={16} />
            {isUpdate ? 'Update Status Pengiriman' : 'Input Resi & Kirim Order'}
          </>
        )}
      </button>
    </form>
  )
}
