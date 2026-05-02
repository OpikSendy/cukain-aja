'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function updateUserStatus(userId: string, status: 'active' | 'suspended') {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: 'Unauthorized' }
    }

    // Verifikasi bahwa requester adalah Admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return { error: 'Forbidden. Hanya Admin yang dapat mengubah status pengguna.' }
    }

    // Gunakan Admin Client untuk update profile pengguna lain (bypass RLS)
    const adminClient = createAdminClient()
    const { error: updateError } = await adminClient
      .from('profiles')
      .update({ status })
      .eq('id', userId)

    if (updateError) {
      return { error: updateError.message }
    }

    // Revalidate halaman terkait
    revalidatePath('/admin/users')
    revalidatePath('/admin/dashboard')

    return { error: null }
  } catch (err: any) {
    return { error: err.message || 'Terjadi kesalahan tidak terduga.' }
  }
}
