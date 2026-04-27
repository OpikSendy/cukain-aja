import { cn } from '@/lib/utils'

export function Skeleton({ className }: { className?: string }) {
    return (
        <div
            className={cn('bg-slate-100 rounded-lg animate-pulse', className)}
        />
    )
}

// ─── Product Card Skeleton ────────────────────────────────────────────────────

export function ProductCardSkeleton() {
    return (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <Skeleton className="aspect-[4/3] rounded-none" />
            <div className="p-4 space-y-2.5">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <div className="pt-2 border-t border-slate-50">
                    <Skeleton className="h-5 w-1/3" />
                </div>
            </div>
        </div>
    )
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: count }).map((_, i) => (
                <ProductCardSkeleton key={i} />
            ))}
        </div>
    )
}

// ─── Table Row Skeleton ───────────────────────────────────────────────────────

export function TableRowSkeleton({ cols = 4 }: { cols?: number }) {
    return (
        <div className="flex items-center gap-4 px-6 py-4 border-b border-slate-50">
            <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
            {Array.from({ length: cols - 1 }).map((_, i) => (
                <Skeleton key={i} className={`h-3.5 ${i === 0 ? 'flex-1' : 'w-16 shrink-0'}`} />
            ))}
        </div>
    )
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
    return (
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-50">
                <Skeleton className="h-4 w-32" />
            </div>
            <div className="divide-y divide-slate-50">
                {Array.from({ length: rows }).map((_, i) => (
                    <TableRowSkeleton key={i} cols={cols} />
                ))}
            </div>
        </div>
    )
}

// ─── Stat Card Skeleton ───────────────────────────────────────────────────────

export function StatCardSkeleton() {
    return (
        <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-3">
            <div className="flex items-start justify-between">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="w-9 h-9 rounded-xl" />
            </div>
            <Skeleton className="h-8 w-20" />
        </div>
    )
}

export function StatsGridSkeleton({ count = 4 }: { count?: number }) {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: count }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
    )
}

// ─── Dashboard Skeleton ───────────────────────────────────────────────────────

export function DashboardSkeleton() {
    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-64" />
            </div>
            <StatsGridSkeleton />
            <TableSkeleton />
        </div>
    )
}

// ─── Product Detail Skeleton ──────────────────────────────────────────────────

export function ProductDetailSkeleton() {
    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-3">
                    <Skeleton className="aspect-square rounded-2xl" />
                    <div className="flex gap-2">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton key={i} className="w-16 h-16 rounded-xl" />
                        ))}
                    </div>
                </div>
                <div className="space-y-5">
                    <div className="flex gap-2">
                        <Skeleton className="h-7 w-28 rounded-full" />
                        <Skeleton className="h-7 w-20 rounded-full" />
                    </div>
                    <Skeleton className="h-9 w-full" />
                    <Skeleton className="h-9 w-3/4" />
                    <div className="p-4 bg-slate-50 rounded-2xl space-y-2">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-10 w-40" />
                    </div>
                    <Skeleton className="h-14 w-full rounded-2xl" />
                    <div className="space-y-2">
                        <Skeleton className="h-3.5 w-full" />
                        <Skeleton className="h-3.5 w-5/6" />
                        <Skeleton className="h-3.5 w-4/6" />
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─── Auction Detail Skeleton ──────────────────────────────────────────────────

export function AuctionDetailSkeleton() {
    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr,360px] gap-8">
                <div className="space-y-6">
                    <Skeleton className="aspect-video rounded-2xl" />
                    <div className="space-y-3">
                        <Skeleton className="h-7 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </div>
                </div>
                <div className="space-y-5">
                    <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-3 w-48" />
                        <Skeleton className="h-14 w-full rounded-xl" />
                    </div>
                    <TableSkeleton rows={4} cols={3} />
                </div>
            </div>
        </div>
    )
}