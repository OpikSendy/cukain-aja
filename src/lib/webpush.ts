import webPush from 'web-push'

import { createAdminClient } from '@/lib/supabase/admin'

// Configure web-push with VAPID keys
webPush.setVapidDetails(
  'mailto:support@cukainaja.id',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
)

export async function sendPushNotification(userId: string, payload: { title: string, body: string, url?: string }) {
  const supabase = createAdminClient()

  // Ambil semua subscription milik user ini
  const { data: subs } = await supabase
    .from('push_subscriptions' as any)
    .select('*')
    .eq('user_id', userId)

  if (!subs || subs.length === 0) return

  const notifications = subs.map(async (sub: any) => {
    try {
      await webPush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        },
        JSON.stringify(payload)
      )
    } catch (error: any) {
      // Jika subscription sudah expired/invalid, hapus dari database
      if (error.statusCode === 410 || error.statusCode === 404) {
        await supabase
          .from('push_subscriptions' as any)
          .delete()
          .eq('endpoint', sub.endpoint as any)
      } else {
        console.error('Error sending push notification:', error)
      }
    }
  })

  await Promise.allSettled(notifications)
}

export { webPush }
