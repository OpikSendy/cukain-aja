/**
 * app/loading.tsx — Global loading (root level)
 *
 * Dipakai saat navigasi antar route group.
 * Minimal — cukup indikator yang jelas tanpa noise.
 */
import { Loader2 } from 'lucide-react'

export default function GlobalLoading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8F7F4]">
            <div className="flex flex-col items-center gap-4">
                {/* Animated logo */}
                <div className="w-12 h-12 bg-[#0B1D3A] rounded-2xl flex items-center justify-center
          animate-pulse">
                    <span className="text-[#C8960C] font-black text-xl">C</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                    <Loader2 size={16} className="animate-spin" />
                    <span className="text-sm font-medium">Memuat...</span>
                </div>
            </div>
        </div>
    )
}