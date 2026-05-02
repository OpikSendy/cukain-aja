import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = createAdminClient()

  const [prodRes, imgRes, auctRes, profRes] = await Promise.all([
    supabase.from('products').select('id, title, status, type, seller_id').limit(10),
    supabase.from('product_images').select('id, product_id, image_url, is_primary').limit(10),
    supabase.from('auctions').select('id, product_id, status').limit(10),
    supabase.from('profiles').select('id, name, role, status').limit(10),
  ])

  return NextResponse.json({
    products: { count: prodRes.data?.length, data: prodRes.data, error: prodRes.error },
    images: { count: imgRes.data?.length, data: imgRes.data, error: imgRes.error },
    auctions: { count: auctRes.data?.length, data: auctRes.data, error: auctRes.error },
    profiles: { count: profRes.data?.length, data: profRes.data, error: profRes.error },
  })
}
