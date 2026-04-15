/**
 * components/shared/EmptyState.tsx
 */
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center text-center py-16 px-4 space-y-4', className)}>
      {icon && (
        <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl
          flex items-center justify-center text-slate-300">
          {icon}
        </div>
      )}
      <div className="space-y-1.5">
        <p className="font-semibold text-[#0B1D3A]">{title}</p>
        {description && <p className="text-sm text-slate-400 max-w-xs">{description}</p>}
      </div>
      {action}
    </div>
  )
}

/**
 * components/shared/StatCard.tsx
 */
interface StatCardProps {
  label: string
  value: string | number
  icon?: React.ReactNode
  trend?: { value: string; positive?: boolean }
  accent?: string
}

export function StatCard({ label, value, icon, trend, accent = '#0B1D3A' }: StatCardProps) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-3">
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
        {icon && (
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${accent}12` }}
          >
            <span style={{ color: accent }}>{icon}</span>
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-[#0B1D3A] tracking-tight">{value}</p>
      {trend && (
        <p className={`text-xs font-medium ${trend.positive ? 'text-green-600' : 'text-red-500'}`}>
          {trend.positive ? '↑' : '↓'} {trend.value}
        </p>
      )}
    </div>
  )
}