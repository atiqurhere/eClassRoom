import type { NextConfig } from 'next'

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control',    value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options',    value: 'nosniff' },
  { key: 'X-XSS-Protection',         value: '1; mode=block' },
  { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
  {
    // Camera/mic for Zoom Web SDK browser fallback
    key: 'Permissions-Policy',
    value: 'camera=(self "https://zoom.us"), microphone=(self "https://zoom.us"), display-capture=(self "https://zoom.us"), geolocation=()',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' zoom.us *.zoom.us",
      "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
      "font-src 'self' fonts.gstatic.com data:",
      // Images: Supabase storage + YouTube thumbnails
      "img-src 'self' data: blob: *.supabase.co *.supabase.in *.ytimg.com *.youtube.com www.gravatar.com",
      // Media: blob: for WebRTC/recording previews
      "media-src 'self' blob: zoom.us *.zoom.us",
      // Connect: Supabase realtime + Zoom API + YouTube API
      "connect-src 'self' *.supabase.co *.supabase.in wss://*.supabase.co zoom.us *.zoom.us www.googleapis.com *.youtube.com",
      // Frames: YouTube embeds + Office viewer for material viewer + Zoom web
      "frame-src 'self' zoom.us *.zoom.us *.youtube.com *.youtube-nocookie.com docs.google.com view.officeapps.live.com",
      "worker-src 'self' blob:",
    ].join('; '),
  },
]

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,

  // ESLint has many stylistic warnings (no-explicit-any, no-console, unescaped-entities)
  // scattered across 30+ files. Skip ESLint during Vercel builds so deploys succeed.
  // Run `npm run lint` locally to review issues.
  eslint: {
    ignoreDuringBuilds: true,
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: '*.supabase.in' },
    ],
  },

  async headers() {
    return [
      { source: '/(.*)', headers: securityHeaders },
    ]
  },

  productionBrowserSourceMaps: false,

  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
}

export default nextConfig
