'use client'

import { Bell, BellOff, Loader2 } from 'lucide-react'
import { usePushNotifications } from '@/lib/hooks/usePushNotifications'

export function PushNotificationToggle() {
  const { isSupported, isSubscribed, isLoading, subscribe, unsubscribe } = usePushNotifications()

  if (!isSupported) {
    return null // Jangan tampilkan jika browser tidak mendukung
  }

  return (
    <button
      onClick={isSubscribed ? unsubscribe : subscribe}
      disabled={isLoading}
      className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors w-full
        ${isSubscribed 
          ? 'text-slate-600 hover:bg-slate-100' 
          : 'bg-[#0B1D3A] text-white hover:bg-[#0B1D3A]/90'
        }`}
    >
      {isLoading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : isSubscribed ? (
        <BellOff size={16} />
      ) : (
        <Bell size={16} />
      )}
      <span>
        {isLoading 
          ? 'Memproses...' 
          : isSubscribed 
            ? 'Matikan Notifikasi' 
            : 'Aktifkan Notifikasi'}
      </span>
    </button>
  )
}
