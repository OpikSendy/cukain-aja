/**
 * app/(admin)/verifications/page.tsx — RSC
 */
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { VerificationQueue } from '@/components/admin/VerificationQueue'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Verifikasi Produk — Admin Cukain Aja' }

export default async function AdminVerificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminClient = createAdminClient()

  const { data: profile } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/unauthorized')

  // Ambil produk pending beserta dokumen dan gambar
  const { data: products } = await adminClient
    .from('products')
    .select(`
      *,
      product_images(*),
      profiles(id, name),
      documents(*),
      verifications(status, notes, verified_at)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0B1D3A]">Antrian Verifikasi</h1>
        <p className="text-slate-500 text-sm mt-1">
          {products?.length ?? 0} produk menunggu review
        </p>
      </div>
      <VerificationQueue products={products ?? []} />
    </div>
  )
}