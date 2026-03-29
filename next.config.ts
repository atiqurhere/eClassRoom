import type { NextConfig } from 'next'

// Zoom runs in its own native app — no embedded iframe needed.
// We still need to allow camera/mic for browser-based Zoom (web client fallback).
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
    // Camera/mic allowed for Zoom Web SDK (browser fallback) and screen-share
    key: 'Permissions-Policy',
    value: 'camera=(self "https://zoom.us"), microphone=(self "https://zoom.us"), display-capture=(self "https://zoom.us"), geolocation=()',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Scripts: allow Zoom Web SDK CDN
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' zoom.us *.zoom.us",
      "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
      "font-src 'self' fonts.gstatic.com data:",
      // Images: Supabase storage + YouTube thumbnails
      "img-src 'self' data: blob: *.supabase.co *.supabase.in *.ytimg.com *.youtube.com www.gravatar.com",
      // Media: blob: for any WebRTC/recording previews
      "media-src 'self' blob: zoom.us *.zoom.us",
      // Connect: Supabase realtime + Zoom API + YouTube API
      "connect-src 'self' *.supabase.co *.supabase.in wss://*.supabase.co zoom.us *.zoom.us www.googleapis.com *.youtube.com",
      // Frames: allow YouTube embeds + Office viewer for material viewer + Zoom web
      "frame-src 'self' zoom.us *.zoom.us *.youtube.com *.youtube-nocookie.com docs.google.com view.officeapps.live.com",
      // Web workers (service worker, WebRTC)
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
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },

  productionBrowserSourceMaps: false,

  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
}

export default nextConfig
