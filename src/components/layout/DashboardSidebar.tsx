'use client'
/**
 * components/layout/DashboardSidebar.tsx
 *
 * Sidebar untuk area dashboard (user/seller/admin).
 * Responsif: drawer di mobile, fixed di desktop.
 */
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Package, Gavel, ShoppingBag,
  Users, ShieldCheck, BarChart3, Settings,
  ChevronRight, Store, FileCheck, AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/lib/types'
import { PushNotificationToggle } from '@/components/shared/PushNotificationToggle'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  badge?: number
}

const NAV_BY_ROLE: Record<UserRole, NavItem[]> = {
  user: [
    { label: 'Dashboard',  href: '/user/dashboard',  icon: <LayoutDashboard size={17} /> },
    { label: 'Pesanan',    href: '/user/orders',     icon: <ShoppingBag size={17} /> },
    { label: 'Profil',     href: '/user/profile',    icon: <Settings size={17} /> },
  ],
  seller: [
    { label: 'Dashboard',  href: '/seller/dashboard',       icon: <LayoutDashboard size={17} /> },
    { label: 'Produk',     href: '/seller/products',        icon: <Package size={17} /> },
    { label: 'Lelang',     href: '/seller/auctions',        icon: <Gavel size={17} /> },
    { label: 'Profil',     href: '/user/profile',           icon: <Settings size={17} /> },
  ],
  admin: [
    { label: 'Dashboard',     href: '/admin/dashboard',     icon: <LayoutDashboard size={17} /> },
    { label: 'Verifikasi',    href: '/admin/verifications', icon: <FileCheck size={17} /> },
    { label: 'Produk',        href: '/admin/products',      icon: <Package size={17} /> },
    { label: 'Pesanan',       href: '/admin/orders',        icon: <ShoppingBag size={17} /> },
    { label: 'Pengguna',      href: '/admin/users',         icon: <Users size={17} /> },
  ],
}

interface DashboardSidebarProps {
  role: UserRole
  name: string
  pendingCount?: number
}

export function DashboardSidebar({ role, name, pendingCount = 0 }: DashboardSidebarProps) {
  const pathname = usePathname()
  const navItems = NAV_BY_ROLE[role]

  return (
    <aside className="w-56 shrink-0 hidden lg:block">
      <div className="sticky top-20 space-y-1">
        {/* Profile card */}
        <div className="px-3 py-4 mb-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#0B1D3A] rounded-xl flex items-center justify-center shrink-0">
              <span className="text-[#C8960C] text-sm font-black uppercase">
                {name.charAt(0)}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#0B1D3A] truncate">{name}</p>
              <p className="text-xs text-slate-400 capitalize">{role}</p>
            </div>
          </div>
        </div>

        {/* Nav items */}
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const showBadge = item.label === 'Verifikasi' && pendingCount > 0

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                isActive
                  ? 'bg-[#0B1D3A] text-white'
                  : 'text-slate-600 hover:text-[#0B1D3A] hover:bg-[#0B1D3A]/5'
              )}
            >
              <span className={isActive ? 'text-[#C8960C]' : 'text-slate-400'}>
                {item.icon}
              </span>
              <span className="flex-1">{item.label}</span>
              {showBadge && (
                <span className={cn(
                  'min-w-[20px] h-5 flex items-center justify-center rounded-full text-[10px] font-bold px-1.5',
                  isActive ? 'bg-[#C8960C] text-[#0B1D3A]' : 'bg-amber-100 text-amber-700'
                )}>
                  {pendingCount > 99 ? '99+' : pendingCount}
                </span>
              )}
              {isActive && !showBadge && (
                <ChevronRight size={14} className="text-white/60" />
              )}
            </Link>
          )
        })}

        <div className="pt-4 mt-4 border-t border-slate-200">
          <PushNotificationToggle />
        </div>
      </div>
    </aside>
  )
}