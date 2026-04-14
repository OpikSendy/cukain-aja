# CLAUDE.md — Cukain Aja · AI Agent System Prompt

> File ini dibaca otomatis oleh Claude Code dan AI agent lain yang mendukung CLAUDE.md.
> Letakkan file ini di root project. Update setiap kali ada perubahan arsitektur besar.

---

## 1. Identitas Project

| Key | Value |
|-----|-------|
| **Nama** | Cukain Aja |
| **Domain** | Marketplace B2C barang lelang / sitaan bea cukai Indonesia |
| **Stack** | Next.js 14 App Router · Supabase · TypeScript · Tailwind CSS · shadcn/ui · Midtrans |
| **Phase saat ini** | MVP — fondasi `lib/` sedang dibangun |
| **Target deploy** | Vercel (frontend) + Supabase (backend) |

---

## 2. Arsitektur Sistem

```
┌─────────────────────────────────────────────┐
│              Next.js App Router              │
│                                             │
│  (public)  (auth)  (user)  (seller)  (admin)│
│     │         │      │       │          │   │
│     └─────────┴──────┴───────┴──────────┘   │
│                    middleware.ts             │
│              (route guard by role)           │
└────────────────────┬────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
   lib/actions/             lib/services/
  (Server Actions)         (Third Party)
        │                         │
        └────────────┬────────────┘
                     │
              Supabase Client
         (Auth · DB · Storage · Realtime)
```

### Prinsip Arsitektur

- **RSC by default** — semua page adalah Server Component kecuali butuh interaktivitas
- **Server Actions untuk semua mutasi** — tidak ada fetch ke API route untuk data mutation
- **RLS adalah garis pertahanan pertama** — tapi server action tetap wajib validasi session
- **Client Component hanya untuk UI state** — form, realtime, animation
- **Tidak ada business logic di client** — semua di `lib/actions/` atau `lib/services/`

---

## 3. Role Sistem

```
guest   → hanya bisa lihat produk public & auction aktif
user    → bisa beli, ikut lelang, lihat order
seller  → upload produk, dokumen, kelola auction (harus di-approve admin)
admin   → approve seller, verifikasi produk, monitor semua transaksi
```

**Status flow:**

```
User register → status: pending → admin approve → status: active
Produk upload → status: draft → submit → pending → admin approve → approved
Auction       → status: upcoming → active (saat start_time) → ended (saat end_time)
```

---

## 4. Database Schema

### Enum Types

```sql
user_role:         user | seller | admin
user_status:       pending | active | suspended
product_type:      fixed | auction
product_status:    draft | pending | approved | rejected | sold
doc_type:          invoice | beacukai | lainnya
verification_status: pending | approved | rejected
auction_status:    upcoming | active | ended
order_status:      pending | paid | shipped | completed | canceled
```

### Tabel Utama & Relasi

```
profiles (extends auth.users)
  └── products (seller_id → profiles.id)
        ├── product_images (product_id)
        ├── product_categories (pivot: product_id ↔ category_id)
        ├── documents (product_id) — private bucket
        ├── verifications (product_id, 1:1)
        └── auctions (product_id, 1:1 optional)
              └── bids (auction_id, user_id)

orders (user_id → profiles.id)
  ├── order_items (order_id, product_id)
  └── payments (order_id)
```

### RLS Active

Semua tabel sudah RLS. Helper functions tersedia di DB:
- `get_user_role()` → user_role
- `is_admin()` → boolean
- `is_seller()` → boolean

---

## 5. Struktur Folder

```
src/
├── app/
│   ├── (auth)/login · register
│   ├── (public)/page · products/[id] · auctions/[id]
│   ├── (user)/dashboard · orders/[id] · profile
│   ├── (seller)/dashboard · products/new · products/[id]/edit · auctions/[id]/manage
│   └── (admin)/dashboard · verifications · users · products
│
├── components/
│   ├── ui/              ← shadcn (jangan dimodifikasi manual)
│   ├── shared/          ← ProductCard · AuctionTimer · StatusBadge
│   ├── auction/         ← BidForm · BidHistory
│   └── product/         ← ProductForm · DocumentUpload
│
├── lib/
│   ├── supabase/        ← client.ts · server.ts
│   ├── actions/         ← auth · products · auctions · orders · payments
│   ├── services/        ← midtrans · storage
│   ├── hooks/           ← useAuction · useAuth
│   ├── types/           ← database.ts (generated) · index.ts (custom)
│   └── utils/           ← format · validators
│
├── middleware.ts
└── constants/config.ts
```

---

## 6. Konvensi Kode

### Return Type Semua Actions

```typescript
type ActionResult<T = void> = {
  data: T | null
  error: string | null
}
```

**Wajib dipakai di semua server actions. Tidak boleh throw error langsung ke client.**

### Server Action Template

```typescript
'use server'
import { createClient } from '@/lib/supabase/server'

export async function actionName(input: InputType): Promise<ActionResult<ReturnType>> {
  const supabase = await createClient()

  // 1. Selalu validasi session dulu
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { data: null, error: 'Unauthorized' }

  // 2. Validasi input
  // 3. Business logic
  // 4. DB operation
  // 5. Return result

  return { data: result, error: null }
}
```

### Client Component Template

```typescript
'use client'
// Selalu ada 'use client' di atas kalau pakai useState/useEffect/event handlers
```

### Import Path

Selalu gunakan alias `@/` — tidak boleh relative path ke atas (`../../`):

```typescript
// ✅ Benar
import { createClient } from '@/lib/supabase/server'

// ❌ Salah
import { createClient } from '../../../lib/supabase/server'
```

---

## 7. Security Rules (NON-NEGOTIABLE)

1. **`SUPABASE_SERVICE_ROLE_KEY`** — tidak boleh ada di file yang mengandung `'use client'` atau `NEXT_PUBLIC_`
2. **Setiap server action** wajib `supabase.auth.getUser()` sebelum query apapun
3. **Dokumen bea cukai** → wajib ke bucket `documents` (private), bukan `product-images`
4. **Midtrans webhook** → wajib validasi signature sebelum update order apapun
5. **TypeScript `any`** → dilarang kecuali ada komentar `// eslint-disable-next-line @typescript-eslint/no-explicit-any` dengan alasan jelas
6. **Seller actions** → selalu cek `profile.status === 'active'` selain role check

---

## 8. Environment Variables

```bash
# Public (aman di client)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=

# Secret (server only — JANGAN PERNAH NEXT_PUBLIC_)
SUPABASE_SERVICE_ROLE_KEY=
MIDTRANS_SERVER_KEY=
MIDTRANS_IS_PRODUCTION=false
```

---

## 9. Pola Data Fetching

### Server Component (RSC) — untuk initial data

```typescript
// app/(public)/products/page.tsx
export default async function ProductsPage() {
  const supabase = await createClient()
  const { data: products } = await supabase
    .from('products')
    .select('*, product_images(*), profiles(name)')
    .eq('status', 'approved')
  return <ProductList products={products ?? []} />
}
```

### Client Hook — untuk realtime

```typescript
// Hanya untuk auction bidding — gunakan Supabase Realtime
// lib/hooks/useAuction.ts
```

---

## 10. Task yang Sedang Dikerjakan

Centang saat selesai dan update file ini.

### Phase 1 — Fondasi ✅

- [x] Database migrations
- [x] Enums & RLS policies
- [x] Storage buckets
- [x] Supabase type generation
- [x] Foundation files: client.ts · server.ts · middleware.ts · config.ts

### Phase 2 — Auth & Profile (CURRENT)

- [ ] `/app/(auth)/register` — form + server action
- [ ] `/app/(auth)/login` — form + server action
- [ ] Auto-create profile trigger (DB)
- [ ] `lib/actions/auth.ts` — register · login · logout · getSession

### Phase 3 — Product System

- [ ] `lib/actions/products.ts` — CRUD
- [ ] `lib/services/storage.ts` — upload image & dokumen
- [ ] Seller product form + document upload
- [ ] Admin product verification flow

### Phase 4 — Auction System

- [ ] `lib/actions/auctions.ts` — create · bid · end
- [ ] `lib/hooks/useAuction.ts` — realtime subscription
- [ ] Bid race condition handling (DB function `place_bid`)
- [ ] Auction auto-end (cron atau DB trigger)

### Phase 5 — Payment

- [ ] `lib/services/midtrans.ts` — snap token · webhook
- [ ] `lib/actions/payments.ts` — create · verify
- [ ] Webhook handler di `/app/api/webhooks/midtrans/route.ts`

### Phase 6 — Polish & Deploy

- [ ] Error boundaries
- [ ] Loading states
- [ ] Vercel deployment
- [ ] Production env

---

## 11. Perintah Penting

```bash
# Generate ulang types setelah perubahan schema DB
npm run db:types

# Development
npm run dev

# Type check
npx tsc --noEmit

# Lint
npm run lint
```

---

## 12. Instruksi untuk AI Agent

Ketika kamu (Claude atau agent lain) membaca file ini, patuhi hal berikut:

### Sebelum menulis kode

1. Cek **Phase mana yang sedang aktif** di section 10
2. Pastikan file yang akan diubah **konsisten dengan konvensi** di section 6
3. Cek **Security Rules** section 7 — tidak ada pengecualian

### Ketika mereview kode

Format output wajib:

```
## Masalah Ditemukan
- [SEVERITY: HIGH/MED/LOW] Deskripsi masalah — baris/file spesifik

## Kode Refactored
[kode lengkap]

## Penjelasan Perubahan
[kenapa setiap perubahan dilakukan]

## Next Step
[apa yang harus dikerjakan setelah ini]
```

### Ketika generate kode baru

- Selalu mulai dengan interface/type dulu sebelum implementasi
- Selalu sertakan error handling
- Selalu gunakan TypeScript strict — tidak ada implicit `any`
- Komponen baru selalu mulai sebagai Server Component, tambah `'use client'` hanya kalau perlu