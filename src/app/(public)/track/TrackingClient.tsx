'use client'

/**
 * app/(public)/track/TrackingClient.tsx
 *
 * Client component untuk halaman tracking publik.
 */

import { useState, useTransition } from 'react'
import { Search, Package, Truck, MapPin, CheckCircle2, AlertCircle, Clock, ExternalLink } from 'lucide-react'
import { trackShipment } from '@/lib/actions/shipping'
import { CourierBadge } from '@/components/shipping/CourierBadge'
import { formatDate, formatDateTime } from '@/lib/utils/format'
import {
  SHIPMENT_STATUS_STEPS,
  getShipmentStatusLabel,
  getShipmentStatusIndex,
  getCourierTrackingUrl,
} from '@/lib/utils/tracking'
import type { ShipmentData } from '@/lib/actions/shipping'
import type { CourierType } from '@/constants/config'

interface TrackResult {
  shipment: ShipmentData
  orderSummary: { orderId: string; itemCount: number; buyerName: string }
}

export function TrackingClient({ initialId }: { initialId?: string }) {
  const [inputId, setInputId] = useState(initialId ?? '')
  const [result, setResult] = useState<TrackResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!inputId.trim()) return
    setError(null)
    setResult(null)

    startTransition(async () => {
      const res = await trackShipment(inputId.trim().toUpperCase())
      if (res.error) {
        setError(res.error)
      } else if (res.data) {
        setResult(res.data)
      }
    })
  }

  const shipment = result?.shipment
  const statusIdx = shipment ? getShipmentStatusIndex(shipment.status as Parameters<typeof getShipmentStatusIndex>[0]) : -1

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Search Form */}
      <form onSubmit={handleSearch} className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="tracking-input"
              type="text"
              value={inputId}
              onChange={(e) => setInputId(e.target.value.toUpperCase())}
              placeholder="Contoh: CKJ-20260503-A1B2C3"
              className="w-full pl-10 pr-4 py-3.5 border-2 border-slate-200 rounded-2xl text-sm font-mono
                focus:outline-none focus:border-[#0B1D3A] focus:ring-4 focus:ring-[#0B1D3A]/10
                placeholder:text-slate-300 transition-all bg-white"
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={isPending || !inputId.trim()}
            className="px-6 py-3.5 bg-[#0B1D3A] text-white text-sm font-bold rounded-2xl
              hover:bg-[#1a3a6e] disabled:opacity-50 transition-all flex items-center gap-2 shrink-0"
          >
            {isPending
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Search size={16} />
            }
            Lacak
          </button>
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-4">
          <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-700">Resi Tidak Ditemukan</p>
            <p className="text-xs text-red-500 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Result */}
      {shipment && result && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Shipment Header Card */}
          <div className="bg-gradient-to-br from-[#0B1D3A] to-[#1a3a6e] rounded-2xl p-6 text-white">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-xs text-blue-300 font-semibold uppercase tracking-widest mb-1">
                  Nomor Resi Cukain Aja
                </p>
                <code className="text-xl font-black tracking-wider">{shipment.internal_tracking_id}</code>
              </div>
              <div className="text-right">
                <CourierBadge
                  courier={shipment.courier as CourierType}
                  trackingNumber={shipment.tracking_number}
                  size="md"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-blue-300 text-xs mb-1">No. Resi Kurir</p>
                <p className="font-mono font-bold">{shipment.tracking_number}</p>
              </div>
              {shipment.estimated_delivery && (
                <div>
                  <p className="text-blue-300 text-xs mb-1">Estimasi Tiba</p>
                  <p className="font-semibold">{formatDate(shipment.estimated_delivery)}</p>
                </div>
              )}
              <div>
                <p className="text-blue-300 text-xs mb-1">Pembeli</p>
                <p className="font-semibold">{result.orderSummary.buyerName}</p>
              </div>
              <div>
                <p className="text-blue-300 text-xs mb-1">Jumlah Item</p>
                <p className="font-semibold">{result.orderSummary.itemCount} produk</p>
              </div>
            </div>

            {/* Link ke kurir */}
            <a
              href={getCourierTrackingUrl(shipment.courier as CourierType, shipment.tracking_number)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex items-center gap-2 text-xs text-blue-200 hover:text-white transition-colors"
            >
              <ExternalLink size={12} />
              Lacak di website {shipment.courier.toUpperCase()}
            </a>
          </div>

          {/* Progress Status */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <MapPin size={16} className="text-[#C8960C]" />
              <h3 className="text-sm font-bold text-[#0B1D3A]">Status Pengiriman</h3>
              <span className="ml-auto text-xs font-bold text-[#C8960C] bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                {getShipmentStatusLabel(shipment.status as Parameters<typeof getShipmentStatusLabel>[0])}
              </span>
            </div>

            {/* Steps */}
            <div className="relative">
              <div className="absolute top-3.5 left-3.5 right-3.5 h-0.5 bg-slate-100 z-0" />
              <div
                className="absolute top-3.5 left-3.5 h-0.5 bg-[#0B1D3A] z-0 transition-all duration-700"
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
                          ? 'bg-[#C8960C] border-[#C8960C] text-white shadow-lg shadow-[#C8960C]/30'
                          : isDone
                            ? 'bg-[#0B1D3A] border-[#0B1D3A] text-white'
                            : 'bg-white border-slate-200 text-slate-300'
                      }`}>
                        {isDone && !isCurrent ? <CheckCircle2 size={13} /> : <MapPin size={11} />}
                      </div>
                      <span className={`text-[9px] font-semibold text-center leading-tight max-w-[52px] ${
                        isCurrent ? 'text-[#C8960C]' : isDone ? 'text-[#0B1D3A]' : 'text-slate-300'
                      }`}>
                        {getShipmentStatusLabel(step)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Timestamps */}
            <div className="mt-4 pt-4 border-t border-slate-50 space-y-2 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <Clock size={13} className="text-slate-300" />
                <span>Dikirim pada:</span>
                <span className="font-semibold text-[#0B1D3A]">{formatDateTime(shipment.created_at)}</span>
              </div>
              {shipment.updated_at !== shipment.created_at && (
                <div className="flex items-center gap-2">
                  <Truck size={13} className="text-slate-300" />
                  <span>Terakhir update:</span>
                  <span className="font-semibold text-[#0B1D3A]">{formatDateTime(shipment.updated_at)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Catatan */}
          {shipment.notes && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex gap-3">
              <Package size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-amber-700 mb-1">Catatan Pengiriman</p>
                <p className="text-sm text-amber-600">{shipment.notes}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!result && !error && !isPending && (
        <div className="text-center py-10">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Truck size={28} className="text-slate-300" />
          </div>
          <p className="text-sm font-semibold text-slate-400">Masukkan nomor resi untuk melacak paket</p>
          <p className="text-xs text-slate-300 mt-1">Format: CKJ-YYYYMMDD-XXXXXX</p>
        </div>
      )}
    </div>
  )
}
