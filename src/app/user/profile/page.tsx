/**
 * app/(user)/profile/page.tsx — RSC
 */
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from '@/components/user/ProfileForm'
import { PinManagement } from '@/components/user/PinManagement'
import { formatDate } from '@/lib/utils/format'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ShieldCheck, Calendar } from 'lucide-react'
import type { Metadata } from 'next'
import { UserStatus } from '@/lib/types'

export const metadata: Metadata = { title: 'Profil — Cukain Aja' }

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const hasPin = !!profile.pin_hash
  const pinSetAt = profile.pin_set_at as string | null

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-2xl font-bold text-[#0B1D3A]">Profil & Pengaturan</h1>

      {/* Account info card */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-[#0B1D3A] rounded-2xl flex items-center justify-center shrink-0">
            <span className="text-[#C8960C] text-xl font-black uppercase">
              {profile.name?.charAt(0) ?? 'U'}
            </span>
          </div>
          <div>
            <p className="font-bold text-[#0B1D3A] text-lg">{profile.name}</p>
            <p className="text-slate-500 text-sm">{user.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="bg-slate-50 rounded-xl px-4 py-3">
            <p className="text-xs text-slate-400 mb-1">Role</p>
            <p className="text-sm font-semibold text-[#0B1D3A] capitalize">{profile.role}</p>
          </div>
          <div className="bg-slate-50 rounded-xl px-4 py-3">
            <p className="text-xs text-slate-400 mb-1">Status</p>
            <StatusBadge status={profile.status as UserStatus} size="sm" />
          </div>
          <div className="bg-slate-50 rounded-xl px-4 py-3 col-span-2">
            <div className="flex items-center gap-2">
              <Calendar size={13} className="text-slate-400" />
              <p className="text-xs text-slate-400">
                Bergabung sejak <span className="font-medium text-slate-600">{formatDate(profile.created_at)}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit profile */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-[#0B1D3A]">Ubah Profil</h2>
        <ProfileForm initialData={{
            name: profile.name ?? '',
            phone: (profile as any).phone,
            address: (profile as any).address,
            city: (profile as any).city,
            province: (profile as any).province,
            postal_code: (profile as any).postal_code,
        }} />
      </div>

      {/* PIN Management */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-[#0B1D3A]">PIN Keamanan</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Untuk login cepat dan konfirmasi pembayaran
            </p>
          </div>
          {hasPin && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-green-50 border border-green-100 rounded-full">
              <ShieldCheck size={13} className="text-green-600" />
              <span className="text-green-700 text-xs font-semibold">Aktif</span>
            </div>
          )}
        </div>

        {hasPin && pinSetAt && (
          <p className="text-xs text-slate-400">
            Terakhir diperbarui: {formatDate(pinSetAt)}
          </p>
        )}

        <PinManagement hasPin={hasPin} userId={user.id} />
      </div>
    </div>
  )
}