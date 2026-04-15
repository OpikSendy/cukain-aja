/**
 * app/(admin)/layout.tsx
 */
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import { DashboardSidebar } from '@/components/layout/DashboardSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('name, role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') redirect('/unauthorized')

    // Ambil pending counts untuk badge
    const { count: pendingCount } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending')

    return (
        <div className="min-h-screen bg-[#F8F7F4]">
            <Navbar />
            <div className="max-w-6xl mx-auto px-4 py-8 flex gap-8">
                <DashboardSidebar
                    role="admin"
                    name={profile.name ?? 'Admin'}
                    pendingCount={pendingCount ?? 0}
                />
                <main className="flex-1 min-w-0">{children}</main>
            </div>
        </div>
    )
}