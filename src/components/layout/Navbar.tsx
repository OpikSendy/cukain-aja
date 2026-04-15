'use client'
/**
 * components/layout/Navbar.tsx
 *
 * Navigasi utama — responsif, role-aware, dengan search dan cart indicator.
 */
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Menu, X, Search, ShoppingBag, ChevronDown,
  LayoutDashboard, Package, Gavel, ShieldCheck,
  LogOut, User, Settings, Bell
} from 'lucide-react'
import { logout } from '@/lib/actions/auth'
import { useAuth } from '@/lib/hooks/useAuth'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { label: 'Produk', href: '/products' },
  { label: 'Lelang', href: '/auctions' },
]

const ROLE_DASHBOARD: Record<string, { label: string; href: string }> = {
  admin:  { label: 'Admin Panel',      href: '/admin/dashboard' },
  seller: { label: 'Seller Dashboard', href: '/seller/dashboard' },
  user:   { label: 'Dashboard',        href: '/user/dashboard' },
}

export function Navbar() {
  const pathname = usePathname()
  const { user, profile, isLoading } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => {
    setIsMenuOpen(false)
    setIsDropdownOpen(false)
  }, [pathname])

  const dashboard = profile?.role ? ROLE_DASHBOARD[profile.role] : null

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full transition-all duration-200',
        scrolled
          ? 'bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm'
          : 'bg-white border-b border-slate-100'
      )}
    >
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-6">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 bg-[#0B1D3A] rounded-lg flex items-center justify-center">
            <span className="text-[#C8960C] font-black text-sm">C</span>
          </div>
          <span className="font-bold text-[#0B1D3A] text-lg tracking-tight hidden sm:block">
            Cukain Aja
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 flex-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                pathname.startsWith(link.href)
                  ? 'text-[#0B1D3A] bg-[#0B1D3A]/5'
                  : 'text-slate-500 hover:text-[#0B1D3A] hover:bg-slate-50'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2 ml-auto">

          {/* Search - desktop */}
          <Link
            href="/products"
            className="hidden md:flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100
              rounded-xl text-sm text-slate-400 transition-colors min-w-[160px]"
          >
            <Search size={15} />
            <span>Cari produk...</span>
          </Link>

          {isLoading ? (
            <div className="w-8 h-8 bg-slate-100 rounded-full animate-pulse" />
          ) : user ? (
            <>
              {/* Notifications - placeholder */}
              <button className="relative w-9 h-9 flex items-center justify-center
                text-slate-500 hover:text-[#0B1D3A] hover:bg-slate-50 rounded-xl transition-colors">
                <Bell size={18} />
                {/* Notif dot */}
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#C8960C] rounded-full" />
              </button>

              {/* User dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen((v) => !v)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-xl
                    hover:bg-slate-50 transition-colors"
                >
                  <div className="w-7 h-7 bg-[#0B1D3A] rounded-full flex items-center justify-center">
                    <span className="text-[#C8960C] text-xs font-bold uppercase">
                      {profile?.name?.charAt(0) ?? 'U'}
                    </span>
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-[#0B1D3A] max-w-[100px] truncate">
                    {profile?.name ?? 'User'}
                  </span>
                  <ChevronDown size={14} className={cn(
                    'text-slate-400 transition-transform',
                    isDropdownOpen && 'rotate-180'
                  )} />
                </button>

                {isDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsDropdownOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-100
                      rounded-2xl shadow-lg overflow-hidden z-50">

                      {/* User info */}
                      <div className="px-4 py-3 border-b border-slate-50">
                        <p className="text-sm font-semibold text-[#0B1D3A] truncate">{profile?.name}</p>
                        <p className="text-xs text-slate-400 capitalize mt-0.5">{profile?.role}</p>
                      </div>

                      {/* Links */}
                      <div className="py-1.5">
                        {dashboard && (
                          <Link
                            href={dashboard.href}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700
                              hover:bg-slate-50 transition-colors"
                          >
                            <LayoutDashboard size={15} className="text-slate-400" />
                            {dashboard.label}
                          </Link>
                        )}

                        {profile?.role === 'seller' && (
                          <Link
                            href="/seller/products"
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700
                              hover:bg-slate-50 transition-colors"
                          >
                            <Package size={15} className="text-slate-400" />
                            Produk Saya
                          </Link>
                        )}

                        {profile?.role === 'user' && (
                          <Link
                            href="/user/orders"
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700
                              hover:bg-slate-50 transition-colors"
                          >
                            <ShoppingBag size={15} className="text-slate-400" />
                            Pesanan
                          </Link>
                        )}

                        <Link
                          href="/user/profile"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700
                            hover:bg-slate-50 transition-colors"
                        >
                          <Settings size={15} className="text-slate-400" />
                          Pengaturan
                        </Link>
                      </div>

                      {/* Logout */}
                      <div className="border-t border-slate-50 py-1.5">
                        <form action={logout}>
                          <button
                            type="submit"
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500
                              hover:bg-red-50 transition-colors"
                          >
                            <LogOut size={15} />
                            Keluar
                          </button>
                        </form>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-slate-600
                  hover:text-[#0B1D3A] transition-colors"
              >
                Masuk
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 bg-[#0B1D3A] text-white text-sm font-semibold
                  rounded-xl hover:bg-[#0B1D3A]/90 transition-colors"
              >
                Daftar
              </Link>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setIsMenuOpen((v) => !v)}
            className="md:hidden w-9 h-9 flex items-center justify-center
              text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-4 space-y-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700
                hover:bg-slate-50 transition-colors"
            >
              {link.label}
            </Link>
          ))}
          {dashboard && (
            <Link
              href={dashboard.href}
              className="block px-4 py-2.5 rounded-xl text-sm font-medium text-[#0B1D3A]
                bg-[#0B1D3A]/5"
            >
              {dashboard.label}
            </Link>
          )}
        </div>
      )}
    </header>
  )
}