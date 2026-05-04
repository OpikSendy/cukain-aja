'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createOrder } from '@/lib/actions/orders'
import { notify } from '@/components/ui/Toaster'
import { MapPin, Loader2, Truck } from 'lucide-react'

interface CheckoutAddressFormProps {
    productId: string
    quantity: number
    initialData?: {
        name: string
        phone: string
        address: string
        city: string
        province: string
        postal_code: string
    }
}

export function CheckoutAddressForm({ productId, quantity, initialData }: CheckoutAddressFormProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [zone, setZone] = useState<'java' | 'outer_java'>('java')

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsLoading(true)

        const formData = new FormData(e.currentTarget)
        const shippingCost = zone === 'java' ? 15000 : 25000

        const result = await createOrder({
            productId,
            quantity,
            shippingName: formData.get('name') as string,
            shippingPhone: formData.get('phone') as string,
            shippingAddress: formData.get('address') as string,
            shippingCity: formData.get('city') as string,
            shippingProvince: formData.get('province') as string,
            shippingPostalCode: formData.get('postal_code') as string,
            shippingCost,
            shippingZone: zone
        })

        if (result.error || !result.data) {
            notify.error('Gagal', result.error ?? 'Terjadi kesalahan')
            setIsLoading(false)
            return
        }

        router.push(`/user/checkout?order=${result.data.orderId}&step=payment`)
    }

    return (
        <form onSubmit={onSubmit} className="space-y-5 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-50">
                <MapPin className="text-[#0B1D3A]" size={18} />
                <h2 className="font-bold text-[#0B1D3A]">Alamat Pengiriman</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Nama Penerima</label>
                    <input name="name" required defaultValue={initialData?.name} className="w-full text-sm p-3 rounded-xl border border-slate-200 focus:border-[#C8960C] focus:ring-1 focus:ring-[#C8960C] outline-none" placeholder="Budi Santoso" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Nomor HP</label>
                    <input name="phone" required defaultValue={initialData?.phone} className="w-full text-sm p-3 rounded-xl border border-slate-200 focus:border-[#C8960C] focus:ring-1 focus:ring-[#C8960C] outline-none" placeholder="081234567890" />
                </div>
                <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Alamat Lengkap</label>
                    <textarea name="address" required defaultValue={initialData?.address} className="w-full text-sm p-3 rounded-xl border border-slate-200 focus:border-[#C8960C] focus:ring-1 focus:ring-[#C8960C] outline-none min-h-[80px]" placeholder="Jl. Sudirman No. 1, RT 01/RW 02, Kec. X" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Kota/Kabupaten</label>
                    <input name="city" required defaultValue={initialData?.city} className="w-full text-sm p-3 rounded-xl border border-slate-200 focus:border-[#C8960C] focus:ring-1 focus:ring-[#C8960C] outline-none" placeholder="Jakarta Selatan" />
                </div>
                <div className="col-span-1 sm:col-span-1">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Provinsi</label>
                    <input name="province" required defaultValue={initialData?.province} className="w-full text-sm p-3 rounded-xl border border-slate-200 focus:border-[#C8960C] focus:ring-1 focus:ring-[#C8960C] outline-none" placeholder="DKI Jakarta" />
                </div>
                <div className="col-span-1 sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Kode Pos</label>
                    <input name="postal_code" required defaultValue={initialData?.postal_code} className="w-full text-sm p-3 rounded-xl border border-slate-200 focus:border-[#C8960C] focus:ring-1 focus:ring-[#C8960C] outline-none" placeholder="12345" />
                </div>
            </div>

            <div className="pt-4 border-t border-slate-50">
                <div className="flex items-center gap-2 mb-3">
                    <Truck className="text-[#0B1D3A]" size={18} />
                    <h3 className="font-bold text-sm text-[#0B1D3A]">Opsi Pengiriman</h3>
                </div>
                <div className="flex gap-3 flex-col sm:flex-row">
                    <label className={`flex-1 p-3 rounded-xl border cursor-pointer transition-all ${zone === 'java' ? 'border-[#C8960C] bg-[#C8960C]/5 ring-1 ring-[#C8960C]' : 'border-slate-200 hover:border-slate-300'}`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <input type="radio" name="zone" value="java" checked={zone === 'java'} onChange={() => setZone('java')} className="accent-[#C8960C]" />
                                <span className="text-sm font-semibold text-[#0B1D3A]">Pulau Jawa</span>
                            </div>
                            <span className="text-sm font-bold text-[#0B1D3A]">Rp15.000</span>
                        </div>
                    </label>
                    <label className={`flex-1 p-3 rounded-xl border cursor-pointer transition-all ${zone === 'outer_java' ? 'border-[#C8960C] bg-[#C8960C]/5 ring-1 ring-[#C8960C]' : 'border-slate-200 hover:border-slate-300'}`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <input type="radio" name="zone" value="outer_java" checked={zone === 'outer_java'} onChange={() => setZone('outer_java')} className="accent-[#C8960C]" />
                                <span className="text-sm font-semibold text-[#0B1D3A]">Luar Jawa</span>
                            </div>
                            <span className="text-sm font-bold text-[#0B1D3A]">Rp25.000</span>
                        </div>
                    </label>
                </div>
            </div>

            <button type="submit" disabled={isLoading} className="w-full py-3.5 bg-[#0B1D3A] text-white font-bold text-sm rounded-xl hover:bg-[#0B1D3A]/90 transition-colors flex justify-center items-center gap-2 disabled:opacity-50">
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                Lanjut ke Pembayaran
            </button>
        </form>
    )
}
