/**
 * app/(admin)/users/page.tsx — RSC
 */
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { UserManagement } from '@/components/admin/UserManagement'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Kelola Pengguna — Admin Cukain Aja' }

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { tab?: string; search?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const activeTab = searchParams.tab ?? 'pending-sellers'

  // Seller pending approval
  const { data: pendingSellers } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'seller')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  // All users
  const { data: allUsers } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0B1D3A]">Kelola Pengguna</h1>
        <p className="text-slate-500 text-sm mt-1">
          Approve seller dan kelola status akun pengguna.
        </p>
      </div>

      <UserManagement
        pendingSellers={pendingSellers ?? []}
        allUsers={allUsers ?? []}
        initialTab={activeTab}
      />
    </div>
  )
}