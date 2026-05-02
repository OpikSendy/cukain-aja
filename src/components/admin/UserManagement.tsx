'use client'
/**
 * components/admin/UserManagement.tsx
 */
import { useState, useTransition } from 'react'
import { CheckCircle, XCircle, Loader2, Users, Store, Search } from 'lucide-react'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatDate } from '@/lib/utils/format'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'

interface UserManagementProps {
  pendingSellers: Profile[]
  allUsers: Profile[]
  initialTab: string
}

import { updateUserStatus } from '@/lib/actions/users'

export function UserManagement({ pendingSellers: initial, allUsers: initialAll, initialTab }: UserManagementProps) {
  const [tab, setTab] = useState(initialTab)
  const [pendingSellers, setPendingSellers] = useState(initial)
  const [allUsers] = useState(initialAll)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')

  const handleApproveSeller = (userId: string) => {
    setProcessingId(`approve-${userId}`)
    startTransition(async () => {
      const result = await updateUserStatus(userId, 'active')
      if (!result.error) {
        setPendingSellers((prev) => prev.filter((s) => s.id !== userId))
      }
      setProcessingId(null)
    })
  }

  const handleRejectSeller = (userId: string) => {
    setProcessingId(`reject-${userId}`)
    startTransition(async () => {
      const result = await updateUserStatus(userId, 'suspended')
      if (!result.error) {
        setPendingSellers((prev) => prev.filter((s) => s.id !== userId))
      }
      setProcessingId(null)
    })
  }

  const filteredUsers = allUsers.filter(u =>
    !search || u.name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-100">
        {[
          { key: 'pending-sellers', label: 'Seller Pending', count: pendingSellers.length, icon: <Store size={15} /> },
          { key: 'all-users', label: 'Semua Pengguna', count: allUsers.length, icon: <Users size={15} /> },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2
              transition-all -mb-px ${tab === t.key
                ? 'border-[#0B1D3A] text-[#0B1D3A]'
                : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            {t.icon}
            {t.label}
            {t.count > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold
                ${tab === t.key ? 'bg-[#0B1D3A] text-white' : 'bg-slate-100 text-slate-600'}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ─ Tab: Pending Sellers ─ */}
      {tab === 'pending-sellers' && (
        <div>
          {pendingSellers.length === 0 ? (
            <div className="text-center py-14 bg-white border border-slate-100 rounded-2xl">
              <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="text-green-400" size={24} />
              </div>
              <p className="font-medium text-slate-700">Semua seller sudah diproses!</p>
              <p className="text-sm text-slate-400 mt-1">Tidak ada antrian pending.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingSellers.map((seller) => (
                <div key={seller.id}
                  className="bg-white border border-slate-100 rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 bg-[#0B1D3A] rounded-xl flex items-center justify-center shrink-0">
                        <span className="text-[#C8960C] font-bold uppercase">
                          {seller.name?.charAt(0) ?? 'S'}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-[#0B1D3A]">{seller.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Daftar: {formatDate(seller.created_at)}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <StatusBadge status="pending" size="sm" />
                          <span className="text-xs text-slate-400 capitalize">{seller.role}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleRejectSeller(seller.id)}
                        disabled={isPending}
                        className="flex items-center gap-1.5 px-3 py-2 border border-red-100
                          text-red-500 rounded-xl text-xs font-semibold hover:bg-red-50
                          transition-colors disabled:opacity-50"
                      >
                        {processingId === `reject-${seller.id}`
                          ? <Loader2 size={13} className="animate-spin" />
                          : <XCircle size={13} />
                        }
                        Tolak
                      </button>
                      <button
                        onClick={() => handleApproveSeller(seller.id)}
                        disabled={isPending}
                        className="flex items-center gap-1.5 px-3 py-2 bg-green-600
                          text-white rounded-xl text-xs font-semibold hover:bg-green-700
                          transition-colors disabled:opacity-50"
                      >
                        {processingId === `approve-${seller.id}`
                          ? <Loader2 size={13} className="animate-spin" />
                          : <CheckCircle size={13} />
                        }
                        Approve
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─ Tab: All Users ─ */}
      {tab === 'all-users' && (
        <div className="space-y-4">
          {/* Search */}
          <div className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl">
            <Search size={15} className="text-slate-400 shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama pengguna..."
              className="flex-1 text-sm text-[#0B1D3A] placeholder:text-slate-400 outline-none bg-transparent"
            />
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
            <div className="divide-y divide-slate-50">
              {filteredUsers.map((u) => (
                <div key={u.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="w-9 h-9 bg-[#0B1D3A] rounded-full flex items-center justify-center shrink-0">
                    <span className="text-[#C8960C] text-xs font-bold uppercase">
                      {u.name?.charAt(0) ?? '?'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#0B1D3A] truncate">{u.name ?? 'Tanpa Nama'}</p>
                    <p className="text-xs text-slate-400 capitalize">{u.role}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={u.status!} size="sm" />
                  </div>
                </div>
              ))}
            </div>

            {filteredUsers.length === 0 && (
              <div className="px-6 py-10 text-center">
                <p className="text-slate-400 text-sm">Tidak ada pengguna ditemukan.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}