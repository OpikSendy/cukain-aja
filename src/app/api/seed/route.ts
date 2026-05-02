import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const key = searchParams.get('key')

  if (process.env.NODE_ENV !== 'development' && key !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = createAdminClient()
  const logs: string[] = []

  try {
    logs.push('Mulai seeding data dummy...')

    // ─── 1. Buat Auth Users & Profiles ───────────────────────────────────────
    const usersToCreate = [
      { email: 'admin@cukain.com', password: 'password123', name: 'Admin Pusat', role: 'admin', status: 'active' },
      { email: 'user1@cukain.com', password: 'password123', name: 'Pembeli Budi', role: 'user', status: 'active' },
      { email: 'seller1@cukain.com', password: 'password123', name: 'Seller Resmi', role: 'seller', status: 'active' },
      { email: 'seller2@cukain.com', password: 'password123', name: 'Seller Baru', role: 'seller', status: 'pending' },
    ]

    const createdUsers: Record<string, string> = {}

    for (const u of usersToCreate) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { name: u.name, role: u.role },
      })

      if (error && (error.message.includes('already registered') || error.message.includes('already been registered'))) {
        logs.push(`User ${u.email} sudah ada, mencari ID...`)
        const { data: existing } = await supabase
          .from('profiles').select('id').eq('name', u.name).maybeSingle()
        if (existing) createdUsers[u.email] = existing.id
      } else if (data?.user) {
        logs.push(`Berhasil buat user: ${u.email}`)
        createdUsers[u.email] = data.user.id
        await supabase.from('profiles').upsert({
          id: data.user.id,
          name: u.name,
          role: u.role as any,
          status: u.status as any,
        }, { onConflict: 'id' })
      } else if (error) {
        logs.push(`Error user ${u.email}: ${error.message}`)
      }
    }

    logs.push(`IDs found: ${JSON.stringify(createdUsers)}`)
    const sellerId = createdUsers['seller1@cukain.com']

    if (!sellerId) {
      logs.push('ERROR: seller1 ID tidak ditemukan. Coba cari dari DB...')
      const { data: s1 } = await supabase
        .from('profiles').select('id').eq('name', 'Seller Resmi').maybeSingle()
      if (s1) {
        createdUsers['seller1@cukain.com'] = s1.id
        logs.push(`Seller Resmi ID ditemukan: ${s1.id}`)
      }
    }

    const finalSellerId = createdUsers['seller1@cukain.com']
    if (!finalSellerId) {
      return NextResponse.json({ success: false, error: 'Seller ID tidak ditemukan di DB', logs }, { status: 500 })
    }

    // ─── 2. Produk Utama ────────────────────────────────────────────────────
    const mainProducts = [
      {
        title: 'PS5 Bekas Sitaan (Kondisi 90%)',
        description: 'Barang sitaan karena tidak membayar pajak masuk. Kondisi nyala normal.',
        price: 6500000, type: 'fixed', status: 'approved', verified: true,
      },
      {
        title: 'iPhone 14 Pro Max 256GB - Non Pajak',
        description: 'Handphone sitaan dari Batam. Kondisi mulus 99%, IMEI belum terdaftar.',
        price: 11000000, type: 'auction', status: 'approved', verified: true,
      },
      {
        title: 'Moge Harley Davidson Street 500',
        description: 'Kendaraan sitaan pelabuhan Tanjung Priok. Surat tidak lengkap.',
        price: 85000000, type: 'auction', status: 'approved', verified: false,
      },
      {
        title: 'Tas Hermes Birkin Original',
        description: 'Tas sitaan bandara Soekarno Hatta. Autentik dengan dustbag.',
        price: 150000000, type: 'fixed', status: 'pending', verified: false,
      },
    ]

    for (const p of mainProducts) {
      const { data: existing } = await supabase
        .from('products').select('id').eq('title', p.title).maybeSingle()

      if (!existing) {
        const { data: newProd, error: prodErr } = await supabase.from('products').insert({
          title: p.title,
          description: p.description,
          price: p.price,
          type: p.type as any,
          status: p.status as any,
          seller_id: finalSellerId,
          is_verified_beacukai: p.verified,
        }).select('id').single()

        if (newProd) {
          logs.push(`✓ Produk: ${p.title}`)
          await supabase.from('product_images').insert([
            { product_id: newProd.id, image_url: `https://placehold.co/600x400/0B1D3A/C8960C?text=${encodeURIComponent(p.title.slice(0, 20))}`, is_primary: true },
          ])
          if (p.type === 'auction' && p.status === 'approved') {
            const now = new Date()
            const end = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
            await supabase.from('auctions').insert({
              product_id: newProd.id,
              start_price: p.price,
              current_price: p.price,
              start_time: now.toISOString(),
              end_time: end.toISOString(),
              status: 'active',
            })
            logs.push(`  └ Lelang dibuat untuk: ${p.title}`)
          }
        } else {
          logs.push(`✗ Gagal buat produk ${p.title}: ${prodErr?.message}`)
        }
      } else {
        logs.push(`→ Skip (sudah ada): ${p.title}`)
      }
    }

    // ─── 3. Bulk Products (30 produk) ─────────────────────────────────────
    logs.push('Generating 30 produk bulk...')
    const categories = ['Elektronik', 'Fashion', 'Otomotif', 'Aksesoris', 'Furniture', 'Perhiasan']
    const conditions = ['Kondisi 95%', 'Kondisi 80%', 'Seperti Baru', 'Bekas Pakai', 'Kondisi 70%']

    for (let i = 1; i <= 30; i++) {
      const pType = i % 2 === 0 ? 'auction' : 'fixed'
      const pStatus = i % 4 === 0 ? 'pending' : (i % 7 === 0 ? 'sold' : 'approved')
      const pPrice = Math.floor(200000 + Math.random() * 15000000)
      const cat = categories[i % categories.length]
      const cond = conditions[i % conditions.length]
      const pTitle = `[Sitaan BC] ${cat} #${i} — ${cond}`

      const { data: newBulk, error: bulkErr } = await supabase.from('products').insert({
        title: pTitle,
        description: `Barang sitaan bea cukai kategori ${cat}. ${cond}. Dijual apa adanya sesuai kondisi.`,
        price: pPrice,
        type: pType as any,
        status: pStatus as any,
        seller_id: finalSellerId,
        is_verified_beacukai: i % 3 !== 0,
      }).select('id').single()

      if (newBulk) {
        await supabase.from('product_images').insert([
          {
            product_id: newBulk.id,
            image_url: `https://placehold.co/600x400/0B1D3A/C8960C?text=${encodeURIComponent(cat + ' ' + i)}`,
            is_primary: true,
          },
        ])

        if (pType === 'auction' && pStatus === 'approved') {
          const now = new Date()
          const end = new Date(now.getTime() + (3 + (i % 5)) * 24 * 60 * 60 * 1000)
          await supabase.from('auctions').insert({
            product_id: newBulk.id,
            start_price: pPrice,
            current_price: pPrice,
            start_time: now.toISOString(),
            end_time: end.toISOString(),
            status: 'active',
          })
        }
      } else {
        logs.push(`✗ Bulk ${i}: ${bulkErr?.message}`)
      }
    }
    logs.push('✓ 30 produk bulk selesai.')

    logs.push('=== Seeding selesai! ===')
    return NextResponse.json({ success: true, logs })
  } catch (error: any) {
    logs.push(`FATAL: ${error.message}`)
    return NextResponse.json({ success: false, error: error.message, logs }, { status: 500 })
  }
}
