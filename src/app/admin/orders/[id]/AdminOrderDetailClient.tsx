'use client'

/**
 * app/admin/orders/[id]/AdminOrderDetail.tsx
 *
 * Client component untuk detail order admin dengan form input resi.
 */

import { useState } from 'react'
import { InputResiForm } from '@/components/shipping/InputResiForm'
import { ShipmentCard } from '@/components/shipping/ShipmentCard'
import type { ShipmentData } from '@/lib/actions/shipping'

interface AdminOrderDetailClientProps {
  orderId: string
  orderStatus: string
  initialShipment: ShipmentData | null
}

export function AdminOrderDetailClient({
  orderId,
  orderStatus,
  initialShipment,
}: AdminOrderDetailClientProps) {
  const [shipment, setShipment] = useState<ShipmentData | null>(initialShipment)

  return (
    <div className="space-y-4">
      {/* Preview shipment jika sudah ada */}
      {shipment && (
        <ShipmentCard
          shipment={shipment}
          orderId={orderId}
          orderStatus={orderStatus}
        />
      )}

      {/* Form input/update resi */}
      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-50 bg-gradient-to-r from-[#C8960C]/5 to-transparent">
          <h3 className="text-sm font-bold text-[#0B1D3A]">
            {shipment ? 'Update Status Pengiriman' : 'Input Resi Pengiriman'}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {shipment
              ? 'Perbarui status pengiriman untuk pembeli'
              : 'Masukkan nomor resi dari kurir pengiriman'}
          </p>
        </div>
        <div className="px-5 py-4">
          <InputResiForm
            orderId={orderId}
            existingShipment={shipment}
            onSuccess={(updated) => setShipment(updated)}
          />
        </div>
      </div>
    </div>
  )
}
