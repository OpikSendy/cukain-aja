/**
 * app/(public)/loading.tsx
 */
import { ProductGridSkeleton } from '@/components/shared/Skeleton'

export default function PublicLoading() {
    return (
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
            <div className="space-y-2">
                <div className="h-8 w-48 bg-slate-100 rounded-xl animate-pulse" />
                <div className="h-4 w-72 bg-slate-100 rounded-xl animate-pulse" />
            </div>
            <ProductGridSkeleton count={8} />
        </div>
    )
}