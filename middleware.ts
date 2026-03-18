import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// ── Simple in-memory rate limiter (per IP, resets on cold-start) ─────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_MAX = 10      // requests
const RATE_LIMIT_WINDOW = 60_000 // 1 minute

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return false
  }

  if (entry.count >= RATE_LIMIT_MAX) return true

  entry.count++
  return false
}

// ── Auth-only paths that need rate limiting ───────────────────────────────────
const RATE_LIMITED_PATHS = ['/api/auth/', '/signup']

// ── Paths that are always public ──────────────────────────────────────────────
const PUBLIC_PATHS = ['/', '/login', '/signup', '/forgot-password', '/reset-password']

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Rate limit sensitive auth endpoints
  if (RATE_LIMITED_PATHS.some(p => path.startsWith(p))) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || '127.0.0.1'

    if (isRateLimited(ip)) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests. Please wait a moment and try again.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60',
          },
        }
      )
    }
  }

  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Single auth + profile fetch (merged into one DB call via FK join)
  const { data: { user } } = await supabase.auth.getUser()

  // Get role in the same request only when we have a user
  let role: string | null = null
  let profileError = null
  if (user) {
    const { data: profile, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
    role = profile?.role ?? null
    profileError = error
  }
  
  if (path === '/' || path === '/login') {
    console.log(`[Middleware Check] Path: ${path} | HasUser: ${!!user} | UserID: ${user?.id} | Role: ${role} | Error:`, profileError)
  }

  // ── Redirect authenticated users away from auth pages ────────────────────
  if (user && role && (path === '/login' || path === '/signup')) {
    return NextResponse.redirect(new URL(`/${role}/dashboard`, request.url))
  }

  // ── Protect all dashboard/account routes ────────────────────────────────
  const isDashboardPath =
    path.startsWith('/admin') ||
    path.startsWith('/teacher') ||
    path.startsWith('/student') ||
    path.startsWith('/profile') ||
    path.startsWith('/messages') ||
    path.startsWith('/notifications')

  if (!user && isDashboardPath) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', path)
    return NextResponse.redirect(loginUrl)
  }

  // ── Role-based access control ────────────────────────────────────────────
  if (user) {
    const safeRole = role || 'student' // fallback if profile query failed
    
    // Redirect authenticated users from landing page
    if (path === '/') {
      return NextResponse.redirect(new URL(`/${safeRole}/dashboard`, request.url))
    }

    // Admin-only routes
    if (path.startsWith('/admin') && safeRole !== 'admin') {
      return NextResponse.redirect(new URL(`/${safeRole}/dashboard`, request.url))
    }
    // Teacher-only routes
    if (path.startsWith('/teacher') && safeRole !== 'teacher') {
      return NextResponse.redirect(new URL(`/${safeRole}/dashboard`, request.url))
    }
    // Student-only routes
    if (path.startsWith('/student') && safeRole !== 'student') {
      return NextResponse.redirect(new URL(`/${safeRole}/dashboard`, request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (Next.js image optimisation)
     * - favicon.ico, public assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|js|css|woff2?)$).*)',
  ],
}
