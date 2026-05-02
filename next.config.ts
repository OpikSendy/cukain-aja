/**
 * next.config.ts — Konfigurasi Next.js untuk production
 *
 * Setup:
 * - Image domains untuk Supabase storage
 * - Security headers
 * - Bundle analyzer (opsional)
 * - Strict mode
 */
import type { NextConfig } from 'next'

const nextConfig: NextConfig & { [key: string]: any } = {  // ─── React Strict Mode ───────────────────────────────────────────────────────
  reactStrictMode: true,

  // ─── Image Optimization ───────────────────────────────────────────────────────
  images: {
    remotePatterns: [
      {
        // Supabase storage — ganti dengan project URL kamu
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        // Supabase storage (CDN)
        protocol: 'https',
        hostname: '*.supabase.in',
        pathname: '/storage/v1/object/public/**',
      },
      {
        // Placeholder images untuk development/seed
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        // Placeholder images alternatif
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        // Picsum random photos
        protocol: 'https',
        hostname: 'picsum.photos',
      },
    ],
    // Format modern untuk performa lebih baik
    formats: ['image/avif', 'image/webp'],
    // Ukuran device yang paling umum
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // ─── TypeScript & ESLint ──────────────────────────────────────────────────────
  typescript: {
    // Error TypeScript akan gagalkan build di production — bagus!
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },

  // ─── Redirects ────────────────────────────────────────────────────────────────
  async redirects() {
    return [
      // Redirect /dashboard → role-based dashboard (handled by middleware)
      {
        source: '/dashboard',
        destination: '/user/dashboard',
        permanent: false,
      },
    ]
  },

  // ─── Headers ──────────────────────────────────────────────────────────────────
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      {
        // Cache static assets aggressively
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ]
  },

  // ─── Experimental ────────────────────────────────────────────────────────────
  experimental: {
    // Server actions sudah stable di Next.js 14+
    serverActions: {
      // Batas ukuran body untuk server actions (default 1MB)
      // Naikkan untuk upload file
      bodySizeLimit: '10mb',
    },
    // Optimasi package imports
    optimizePackageImports: [
      'lucide-react',
      '@supabase/supabase-js',
      '@supabase/ssr',
    ],
  },

  // ─── Logging ─────────────────────────────────────────────────────────────────
  logging: {
    fetches: {
      // Log fetch requests di development
      fullUrl: process.env.NODE_ENV === 'development',
    },
  },
}

export default nextConfig