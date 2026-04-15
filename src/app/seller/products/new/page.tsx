/**
 * app/(seller)/products/new/page.tsx — RSC
 */
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProductForm } from '@/components/product/ProductForm'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Tambah Produk — Cukain Aja' }

export default async function NewProductPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, status')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'seller' || profile?.status !== 'active') {
    redirect('/seller/dashboard')
  }

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#0B1D3A]">Tambah Produk Baru</h1>
        <p className="text-slate-500 text-sm mt-1">
          Isi informasi produk, upload foto dan dokumen, lalu submit untuk verifikasi admin.
        </p>
      </div>
      <ProductForm categories={categories ?? []} mode="create" />
    </div>
  )
}