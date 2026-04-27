'use client'
/**
 * components/layout/MobileDashboardNav.tsx
 *
 * Bottom navigation bar untuk dashboard di mobile.
 * Muncul hanya di layar kecil (< lg).
 *
 * Mount ini di layout user/seller/admin.
 */
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard, Package, ShoppingBag,
    Settings, FileCheck, Users
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/lib/types'

const NAV_BY_ROLE: Record<UserRole, { label: string; href: string; icon: React.ReactNode }[]> = {
    user: [
        { label: 'Dashboard', href: '/user/dashboard', icon: <LayoutDashboard size={21} /> },
        { label: 'Pesanan', href: '/user/orders', icon: <ShoppingBag size={21} /> },
        { label: 'Profil', href: '/user/profile', icon: <Settings size={21} /> },
    ],
    seller: [
        { label: 'Dashboard', href: '/seller/dashboard', icon: <LayoutDashboard size={21} /> },
        { label: 'Produk', href: '/seller/products', icon: <Package size={21} /> },
        { label: 'Profil', href: '/user/profile', icon: <Settings size={21} /> },
    ],
    admin: [
        { label: 'Dashboard', href: '/admin/dashboard', icon: <LayoutDashboard size={21} /> },
        { label: 'Verifikasi', href: '/admin/verifications', icon: <FileCheck size={21} /> },
        { label: 'Pengguna', href: '/admin/users', icon: <Users size={21} /> },
        { label: 'Pengaturan', href: '/user/profile', icon: <Settings size={21} /> },
    ],
}

interface MobileDashboardNavProps {
    role: UserRole
    pendingCount?: number
}

export function MobileDashboardNav({ role, pendingCount = 0 }: MobileDashboardNavProps) {
    const pathname = usePathname()
    const navItems = NAV_BY_ROLE[role]

    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40
      bg-white/95 backdrop-blur-md border-t border-slate-100 safe-area-pb">
            <div className="flex">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                    const showBadge = item.label === 'Verifikasi' && pendingCount > 0

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex-1 flex flex-col items-center justify-center py-3 gap-1 relative',
                                'transition-colors duration-150',
                                isActive ? 'text-[#0B1D3A]' : 'text-slate-400'
                            )}
                        >
                            {/* Active indicator */}
                            {isActive && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5
                  bg-[#C8960C] rounded-full" />
                            )}

                            {/* Badge */}
                            {showBadge && (
                                <div className="absolute top-2 right-[calc(50%-10px)] w-4 h-4
                  bg-[#C8960C] rounded-full flex items-center justify-center">
                                    <span className="text-[9px] font-bold text-white">
                                        {pendingCount > 9 ? '9+' : pendingCount}
                                    </span>
                                </div>
                            )}

                            <span className={cn(
                                'transition-transform duration-150',
                                isActive && 'scale-110'
                            )}>
                                {item.icon}
                            </span>
                            <span className="text-[10px] font-semibold">{item.label}</span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}