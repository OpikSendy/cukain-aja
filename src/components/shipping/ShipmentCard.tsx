'use client'

/**
 * components/shipping/ShipmentCard.tsx
 *
 * Kartu info pengiriman untuk halaman order detail user.
 * Menampilkan: kurir, resi, internal tracking ID, progress status,
 * estimasi tiba, dan tombol konfirmasi penerimaan.
 */

import { useState, useTransition } from 'react'
import { Package, Copy, Check, Truck, MapPin, ExternalLink, CheckCircle2, Clock } from 'lucide-react'
import { CourierBadge } from '@/components/shipping/CourierBadge'
import { confirmDelivery } from '@/lib/actions/shipping'
import { formatDate } from '@/lib/utils/format'
import {
  SHIPMENT_STATUS_STEPS,
  getShipmentStatusLabel,
  getShipmentStatusIndex,
  getCourierTrackingUrl,
} from '@/lib/utils/tracking'
import type { ShipmentData } from '@/lib/actions/shipping'
import type { CourierType } from '@/constants/config'

interface ShipmentCardProps {
  shipment: ShipmentData
  orderId: string
  orderStatus: string
}

export function ShipmentCard({ shipment, orderId, orderStatus }: ShipmentCardProps) {
  const [copied, setCopied] = useState<'internal' | 'resi' | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const statusIdx = getShipmentStatusIndex(shipment.status as Parameters<typeof getShipmentStatusIndex>[0])
  const isDelivered = shipment.status === 'delivered'
  const canConfirm = orderStatus === 'shipped' && !isDelivered && !confirmed

  function handleCopy(text: string, type: 'internal' | 'resi') {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(type)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  function handleConfirm() {
    startTransition(async () => {
      const result = await confirmDelivery(orderId)
      if (result.error) {
        setError(result.error)
      } else {
        setConfirmed(true)
      }
    })
  }

  const trackUrl = getCourierTrackingUrl(
    shipment.courier as CourierType,
    shipment.tracking_number
  )

  return (
    <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-50 bg-gradient-to-r from-[#0B1D3A]/3 to-transparent">
        <div className="w-8 h-8 rounded-xl bg-[#0B1D3A] flex items-center justify-center">
          <Truck size={15} className="text-white" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-[#0B1D3A]">Informasi Pengiriman</h2>
          <p className="text-[11px] text-slate-400">Detail kurir dan nomor resi</p>
        </div>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Kurir + Resi Eksternal */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="space-y-1.5">
            <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Kurir</p>
            <CourierBadge
              courier={shipment.courier as CourierType}
              trackingNumber={shipment.tracking_number}
              size="md"
            />
          </div>

          <div className="space-y-1.5 text-right">
            <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">No. Resi Kurir</p>
            <div className="flex items-center gap-1.5 justify-end">
              <code className="text-sm font-mono font-bold text-[#0B1D3A] bg-slate-50 px-2 py-1 rounded-lg">
                {shipment.tracking_number}
              </code>
              <button
                onClick={() => handleCopy(shipment.tracking_number, 'resi')}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                title="Salin nomor resi"
              >
                {copied === 'resi' ? <Check size={13} className="text-green-600" /> : <Copy size={13} className="text-slate-500" />}
              </button>
              <a
                href={trackUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                title="Lacak di website kurir"
              >
                <ExternalLink size={13} className="text-slate-500" />
              </a>
            </div>
          </div>
        </div>

        {/* Internal Tracking ID (Resi Cukain Aja) */}
        <div className="bg-gradient-to-r from-[#0B1D3A] to-[#1a3a6e] rounded-xl p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] text-blue-200 font-semibold uppercase tracking-widest mb-1">
                Nomor Resi Cukain Aja
              </p>
              <code className="text-lg font-mono font-black text-white tracking-wider">
                {shipment.internal_tracking_id}
              </code>
              <p className="text-[10px] text-blue-300 mt-1">
                Gunakan kode ini untuk melacak paket Anda di cukainaja.id/track
              </p>
            </div>
            <button
              onClick={() => handleCopy(shipment.internal_tracking_id, 'internal')}
              className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors shrink-0"
              title="Salin nomor resi internal"
            >
              {copied === 'internal'
                ? <Check size={16} className="text-green-300" />
                : <Copy size={16} className="text-white" />
              }
            </button>
          </div>
        </div>

        {/* Estimasi Tiba */}
        {shipment.estimated_delivery && (
          <div className="flex items-center gap-2 text-sm">
            <Clock size={15} className="text-[#C8960C]" />
            <span className="text-slate-500">Estimasi tiba:</span>
            <span className="font-semibold text-[#0B1D3A]">
              {formatDate(shipment.estimated_delivery)}
            </span>
          </div>
        )}

        {/* Progress Bar Status */}
        <div className="space-y-2">
          <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
            Status Pengiriman
          </p>
          <div className="relative">
            {/* Track line */}
            <div className="absolute top-3.5 left-3.5 right-3.5 h-0.5 bg-slate-100 z-0" />
            <div
              className="absolute top-3.5 left-3.5 h-0.5 bg-[#0B1D3A] z-0 transition-all duration-500"
              style={{
                width: statusIdx >= 0
                  ? `${(statusIdx / (SHIPMENT_STATUS_STEPS.length - 1)) * 100}%`
                  : '0%',
                maxWidth: 'calc(100% - 28px)',
              }}
            />

            <div className="relative z-10 flex justify-between">
              {SHIPMENT_STATUS_STEPS.map((step, i) => {
                const isDone = i <= statusIdx
                const isCurrent = i === statusIdx

                return (
                  <div key={step} className="flex flex-col items-center gap-1.5">
                    <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
                      isCurrent
                        ? 'bg-[#C8960C] border-[#C8960C] text-white shadow-md shadow-[#C8960C]/30'
                        : isDone
                          ? 'bg-[#0B1D3A] border-[#0B1D3A] text-white'
                          : 'bg-white border-slate-200 text-slate-300'
                    }`}>
                      {isDone && !isCurrent
                        ? <Check size={12} />
                        : <MapPin size={11} />
                      }
                    </div>
                    <span className={`text-[9px] font-semibold text-center leading-tight max-w-[48px] ${
                      isCurrent ? 'text-[#C8960C]' : isDone ? 'text-[#0B1D3A]' : 'text-slate-300'
                    }`}>
                      {getShipmentStatusLabel(step)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Notes */}
        {shipment.notes && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 flex gap-2">
            <Package size={14} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">{shipment.notes}</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        {/* Konfirmasi Penerimaan */}
        {confirmed ? (
          <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
            <CheckCircle2 size={16} className="text-green-600" />
            <p className="text-sm font-semibold text-green-700">
              Terima kasih! Penerimaan telah dikonfirmasi.
            </p>
          </div>
        ) : canConfirm && (
          <button
            onClick={handleConfirm}
            disabled={isPending}
            className="w-full py-3 rounded-xl bg-[#0B1D3A] text-white text-sm font-bold
              hover:bg-[#1a3a6e] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isPending ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Mengkonfirmasi...
              </>
            ) : (
              <>
                <CheckCircle2 size={16} />
                Konfirmasi Penerimaan Barang
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
