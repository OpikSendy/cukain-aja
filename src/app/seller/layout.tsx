/**
 * app/(seller)/layout.tsx
 */
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import { DashboardSidebar } from '@/components/layout/DashboardSidebar'

export default async function SellerLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('name, role, status')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'seller') redirect('/user/dashboard')
    if (profile?.status !== 'active') redirect('/pending-approval')

    return (
        <div className="min-h-screen bg-[#F8F7F4]">
            <Navbar />
            <div className="max-w-6xl mx-auto px-4 py-8 flex gap-8">
                <DashboardSidebar role="seller" name={profile.name ?? 'Seller'} />
                <main className="flex-1 min-w-0">{children}</main>
            </div>
        </div>
    )
}