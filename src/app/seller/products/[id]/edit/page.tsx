/**
 * app/(seller)/products/[id]/edit/page.tsx — RSC
 */
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProductForm } from '@/components/product/ProductForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Edit Produk — Cukain Aja' }

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: product } = await supabase
    .from('products')
    .select('*, product_images(*), documents(*)')
    .eq('id', params.id)
    .eq('seller_id', user.id)
    .single()

  if (!product) notFound()

  // Hanya bisa edit draft atau rejected
  if (!['draft', 'rejected'].includes(product.status!)) {
    redirect('/seller/products')
  }

  const { data: categories } = await supabase.from('categories').select('*').order('name')

  const productWithProfile = {
    ...product,
    profiles: null, // tidak dibutuhkan di form
  }

  return (
    <div className="max-w-2xl mx-auto px-0 py-0">
      <div className="mb-8">
        <Link href="/seller/products"
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-[#0B1D3A]
            transition-colors mb-4">
          <ArrowLeft size={16} />
          Kembali
        </Link>
        <h1 className="text-2xl font-bold text-[#0B1D3A]">Edit Produk</h1>
        {product.status === 'rejected' && (
          <div className="mt-3 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
            <p className="text-red-600 text-sm font-medium">⚠️ Produk ini ditolak admin.</p>
            <p className="text-red-500 text-xs mt-0.5">
              Perbaiki dan submit ulang untuk verifikasi.
            </p>
          </div>
        )}
      </div>
      <ProductForm
        product={productWithProfile as any}
        categories={categories ?? []}
        mode="edit"
      />
    </div>
  )
}