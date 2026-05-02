import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'

/**
 * Membuat Supabase Client khusus Admin yang menggunakan Service Role Key.
 * Ini BUKAN untuk dipanggil di client side, HANYA untuk Server Actions/API Routes.
 * Fungsinya untuk melakukan operasi bypass RLS (misalnya: update profile status, generate magic link).
 */
export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY tidak ditemukan di environment variables.')
  }

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
