
import { DashboardSkeleton } from '@/components/shared/Skeleton'

export default function AdminLoading() {
    return (
        <div className="max-w-6xl mx-auto px-4 py-8 flex gap-8">
            {/* Sidebar placeholder */}
            <div className="w-56 shrink-0 hidden lg:block space-y-2">
                <div className="h-16 bg-slate-100 rounded-2xl animate-pulse" />
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-10 bg-slate-100 rounded-xl animate-pulse" />
                ))}
            </div>
            <div className="flex-1 min-w-0">
                <DashboardSkeleton />
            </div>
        </div>
    )
}