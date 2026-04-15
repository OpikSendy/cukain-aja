/**
 * app/(user)/layout.tsx — User area layout
 */
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import { DashboardSidebar } from '@/components/layout/DashboardSidebar'
import { UserRole } from '@/lib/types'

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, role, status')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  return (
    <div className="min-h-screen bg-[#F8F7F4]">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8 flex gap-8">
        <DashboardSidebar role={profile.role as UserRole} name={profile.name ?? 'User'} />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  )
}