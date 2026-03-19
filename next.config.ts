import type { NextConfig } from 'next'
const JITSI_DOMAIN = 'meet.jit.si'

const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    // Allow camera and microphone for Jitsi
    key: 'Permissions-Policy',
    value: 'camera=(self "https://meet.jit.si"), microphone=(self "https://meet.jit.si"), display-capture=(self "https://meet.jit.si"), geolocation=()',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Jitsi external_api.js is served from meet.jit.si, NOT *.jitsi.net
      `script-src 'self' 'unsafe-eval' 'unsafe-inline' ${JITSI_DOMAIN} *.${JITSI_DOMAIN} 8x8.vc *.jitsi.net`,
      "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
      "font-src 'self' fonts.gstatic.com data:",
      `img-src 'self' data: blob: *.supabase.co *.supabase.in ${JITSI_DOMAIN} *.${JITSI_DOMAIN}`,
      // blob: needed for recording previews, WebRTC streams
      `media-src 'self' blob: ${JITSI_DOMAIN} *.${JITSI_DOMAIN}`,
      `connect-src 'self' *.supabase.co *.supabase.in wss://*.supabase.co ${JITSI_DOMAIN} *.${JITSI_DOMAIN} wss://${JITSI_DOMAIN} 8x8.vc *.jitsi.net *.youtube.com`,
      // allow Jitsi iframe to render inside our pages
      `frame-src 'self' ${JITSI_DOMAIN} *.${JITSI_DOMAIN} 8x8.vc *.youtube.com *.youtube-nocookie.com`,
      // worker-src for WebRTC
      "worker-src 'self' blob:",
    ].join('; '),
  },
]


const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.in',
      },
    ],
  },

  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },

  // Suppress source maps in production for security
  productionBrowserSourceMaps: false,

  // Required for correct manifest generation with route groups in Next.js 15
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
}

export default nextConfig
