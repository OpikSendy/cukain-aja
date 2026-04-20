import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/Toaster';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
})

export const viewport: Viewport = {
  themeColor: '#0B1D3A',
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  title: {
    default: 'Cukain Aja — Marketplace Barang Bea Cukai',
    template: '%s — Cukain Aja',
  },
  description:
    'Platform jual beli dan lelang barang sitaan bea cukai Indonesia. Transparan, terverifikasi, terpercaya.',
  keywords: ['bea cukai', 'lelang', 'marketplace', 'barang sitaan', 'customs'],
  authors: [{ name: 'Cukain Aja' }],
  creator: 'Cukain Aja',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    siteName: 'Cukain Aja',
    title: 'Cukain Aja — Marketplace Barang Bea Cukai',
    description: 'Platform jual beli dan lelang barang sitaan bea cukai Indonesia.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={jakarta.variable}>
      <body className="font-jakarta antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  )
}