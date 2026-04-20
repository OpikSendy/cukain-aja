/**
 * components/ui/Toaster.tsx
 *
 * Wrapper untuk Sonner toast notifications.
 * Install: npm install sonner
 *
 * Cara pakai di mana saja:
 *   import { toast } from 'sonner'
 *   toast.success('Produk berhasil disimpan')
 *   toast.error('Gagal upload foto')
 *   toast.loading('Memproses...')
 *   toast.promise(myPromise, { loading: '...', success: '...', error: '...' })
 */
'use client'

import { Toaster as Sonner } from 'sonner'

export function Toaster() {
    return (
        <Sonner
            position="bottom-right"
            toastOptions={{
                classNames: {
                    toast: `
            !bg-white !border !border-slate-100 !shadow-lg !rounded-2xl
            !font-sans !text-sm !text-[#0B1D3A] !px-4 !py-3
          `,
                    title: '!font-semibold !text-[#0B1D3A]',
                    description: '!text-slate-500',
                    success: '!border-green-100',
                    error: '!border-red-100',
                    warning: '!border-amber-100',
                    info: '!border-blue-100',
                    actionButton: `
            !bg-[#0B1D3A] !text-white !rounded-lg !font-semibold
            !text-xs !px-3 !py-1.5
          `,
                    cancelButton: `
            !bg-slate-100 !text-slate-600 !rounded-lg !font-semibold
            !text-xs !px-3 !py-1.5
          `,
                    icon: '!text-base',
                },
                style: {
                    fontFamily: 'inherit',
                },
            }}
            gap={8}
            richColors
            closeButton
            expand={false}
            duration={4000}
        />
    )
}

/**
 * Helper functions untuk toast yang konsisten di seluruh app.
 * Import dan gunakan ini alih-alih memanggil toast() langsung.
 */
import { toast } from 'sonner'

export const notify = {
    success: (message: string, description?: string) =>
        toast.success(message, { description }),

    error: (message: string, description?: string) =>
        toast.error(message, { description }),

    loading: (message: string) =>
        toast.loading(message),

    info: (message: string, description?: string) =>
        toast.info(message, { description }),

    /**
     * Untuk async actions — otomatis handle loading → success/error state.
     * @example
     * notify.promise(uploadImage(), {
     *   loading: 'Mengupload foto...',
     *   success: 'Foto berhasil diupload',
     *   error: (err) => err.message,
     * })
     */
    promise: <T,>(
        promise: Promise<T>,
        messages: {
            loading: string
            success: string | ((value: T) => string)
            error: string | ((reason: any) => string)
        }
    ) => toast.promise(promise, messages),

    dismiss: () => toast.dismiss(),
} as const;