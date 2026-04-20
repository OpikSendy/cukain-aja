import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Clock, CheckCircle, Mail, LogOut } from 'lucide-react'
import { logout } from '@/lib/actions/auth'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Menunggu Persetujuan — Cukain Aja' }

export default async function PendingApprovalPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: profile } = user
        ? await supabase.from('profiles').select('name, status, created_at').eq('id', user.id).single()
        : { data: null }

    // Kalau sudah di-approve, redirect tidak perlu — middleware handle
    const steps = [
        { label: 'Akun dibuat', done: true, icon: <CheckCircle size={16} /> },
        { label: 'Verifikasi email', done: true, icon: <CheckCircle size={16} /> },
        { label: 'Review admin (1–2 hari kerja)', done: false, icon: <Clock size={16} /> },
        { label: 'Akun seller aktif', done: false, icon: <CheckCircle size={16} /> },
    ]

    return (
        <div className="min-h-screen bg-[#F8F7F4] flex items-center justify-center px-4">
            <div className="bg-white border border-slate-100 rounded-3xl p-8 md:p-12
        max-w-md w-full shadow-sm text-center space-y-6">

                {/* Icon */}
                <div className="relative mx-auto w-20 h-20">
                    <div className="w-20 h-20 bg-[#C8960C]/10 rounded-full flex items-center justify-center">
                        <Clock className="text-[#C8960C]" size={32} />
                    </div>
                    {/* Pulse ring */}
                    <div className="absolute inset-0 rounded-full border-2 border-[#C8960C]/30 animate-ping" />
                </div>

                {/* Content */}
                <div>
                    <h1 className="text-2xl font-bold text-[#0B1D3A]">
                        Akun Kamu Sedang Diproses
                    </h1>
                    <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                        {profile?.name ? `Hai ${profile.name.split(' ')[0]}, t` : 'T'}im admin Cukain Aja
                        sedang memverifikasi pendaftaran seller kamu.
                        Proses ini biasanya membutuhkan <strong>1–2 hari kerja</strong>.
                    </p>
                </div>

                {/* Progress steps */}
                <div className="space-y-3 text-left">
                    {steps.map((step, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0
                border-2 transition-all ${step.done
                                    ? 'bg-green-500 border-green-500 text-white'
                                    : i === steps.findIndex(s => !s.done)
                                        ? 'bg-[#C8960C]/10 border-[#C8960C] text-[#C8960C]'
                                        : 'bg-slate-50 border-slate-200 text-slate-300'
                                }`}>
                                {step.icon}
                            </div>
                            <span className={`text-sm font-medium ${step.done ? 'text-green-700'
                                    : i === steps.findIndex(s => !s.done) ? 'text-[#C8960C]'
                                        : 'text-slate-300'
                                }`}>
                                {step.label}
                            </span>
                            {i === steps.findIndex(s => !s.done) && (
                                <span className="ml-auto text-[10px] font-semibold text-[#C8960C]
                  bg-[#C8960C]/10 px-2 py-0.5 rounded-full">
                                    Sedang Diproses
                                </span>
                            )}
                        </div>
                    ))}
                </div>

                {/* Info box */}
                <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100
          rounded-xl text-left">
                    <Mail size={16} className="text-blue-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-blue-600 leading-relaxed">
                        Kami akan mengirim notifikasi email saat akun seller kamu sudah aktif.
                        Pastikan kamu memeriksa inbox dan folder spam.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                    <Link
                        href="/products"
                        className="w-full py-3 bg-[#0B1D3A] text-white rounded-xl font-semibold
              text-sm hover:bg-[#0B1D3A]/90 transition-colors"
                    >
                        Jelajahi Produk Sambil Menunggu
                    </Link>
                    <form action={logout}>
                        <button
                            type="submit"
                            className="w-full flex items-center justify-center gap-2 py-2.5
                text-sm text-slate-500 hover:text-slate-700 transition-colors"
                        >
                            <LogOut size={14} />
                            Keluar dari Akun
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}