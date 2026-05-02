'use client'

import { useEffect, Suspense, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { notify } from '@/components/ui/Toaster'
import { Loader2 } from 'lucide-react'

function ImplicitCallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const hasFinished = useRef(false) // Mencegah navigasi ganda

  useEffect(() => {
    const supabase = createClient()
    const next = searchParams.get('next') ?? '/user/dashboard'

    // 1. Tangani Error langsung dari Hash
    if (window.location.hash.includes('error_description')) {
      const params = new URLSearchParams(window.location.hash.substring(1))
      notify.error(decodeURIComponent(params.get('error_description') ?? 'Login gagal'))
      router.replace('/login')
      return
    }

    // 2. Gunakan Listener sebagai jalur utama
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session && !hasFinished.current) {
        hasFinished.current = true;

        // Memberikan waktu kecil bagi browser untuk memantapkan cookie/localstorage
        setTimeout(() => {
          window.location.href = next;
        }, 100);
      }
    })

    // 3. Pengecekan Proaktif (Manual Parsing)
    const handleManualParse = async () => {
      if (window.location.hash.includes('access_token') && !hasFinished.current) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')

        if (accessToken && refreshToken) {
          const { data } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })
          if (data.session && !hasFinished.current) {
            hasFinished.current = true;
            window.location.href = next; // ← same here
          }
        }
      }
    }

    handleManualParse()

    // 4. Fallback Timeout yang lebih longgar (5 detik)
    const timeoutId = setTimeout(async () => {
      if (!hasFinished.current) {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          notify.error('Sesi login tidak valid atau kadaluarsa')
          router.replace('/login')
        } else {
          hasFinished.current = true;
          window.location.href = next; // ← same here
        }
      }
    }, 5000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeoutId)
    }
  }, [router, searchParams])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8F7F4]">
      <Loader2 size={40} className="animate-spin text-[#0B1D3A] mb-4" />
      <span className="font-medium text-[#0B1D3A]">Memverifikasi login PIN...</span>
    </div>
  )
}

export default function ImplicitCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8F7F4]">
        <Loader2 size={40} className="animate-spin text-[#0B1D3A] mb-4" />
        <span className="font-medium text-[#0B1D3A]">Memverifikasi login PIN...</span>
      </div>
    }>
      <ImplicitCallbackHandler />
    </Suspense>
  )
}
