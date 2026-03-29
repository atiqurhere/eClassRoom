const CACHE_NAME = 'latifia-eclassroom-v3'
const STATIC_ASSETS = [
  '/manifest.json',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Only handle GET requests
  if (event.request.method !== 'GET') return

  // Never intercept:
  // - External domains (Zoom, Supabase, Google, analytics, etc.)
  // - Our own API routes
  // - The live-room page (must always be fresh, never served stale)
  // - Next.js internal routes
  if (url.hostname !== self.location.hostname) return
  if (url.pathname.startsWith('/api/')) return
  if (url.pathname.startsWith('/live-room')) return
  if (url.pathname.startsWith('/_next/')) return

  // Network-first for HTML pages (always fresh content)
  if (event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    )
    return
  }

  // Cache-first for static assets (JS, CSS, images, fonts)
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached
      return fetch(event.request).then((response) => {
        if (response.ok && response.type === 'basic') {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        }
        return response
      }).catch(() => {
        // If network fails and nothing cached, let the browser handle it naturally
        return new Response('', { status: 408 })
      })
    })
  )
})
