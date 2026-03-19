import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// ── Simple in-memory rate limiter ──────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 })
    return false
  }
  if (entry.count >= 10) return true
  entry.count++
  return false
}

const RATE_LIMITED_PATHS = ['/api/auth/', '/signup']
// Auth pages that logged-in users should never see (landing page '/' is public — shows different content)
const GUEST_ONLY_PATHS   = ['/login', '/signup', '/forgot-password', '/reset-password']
const PROTECTED_PREFIXES = ['/admin', '/teacher', '/student', '/profile', '/messages', '/notifications']

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Rate limit
  if (RATE_LIMITED_PATHS.some(p => path.startsWith(p))) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1'
    if (isRateLimited(ip)) {
      return new NextResponse(JSON.stringify({ error: 'Too many requests.' }), {
        status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': '60' },
      })
    }
  }

  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
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

  // ── Detect authenticated user ────────────────────────────────────────────
  // Try getUser() first (validates JWT server-side).
  // Fall back to getSession() (reads cookie, no network call) if getUser fails.
  let userId: string | null = null

  const { data: { user }, error: userErr } = await supabase.auth.getUser()
  if (!userErr && user) {
    userId = user.id
  } else {
    // Fallback: read session directly from cookie (avoids network dependency)
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      userId = session.user.id
    }
  }

  // ── Get role ─────────────────────────────────────────────────────────────
  let role: string | null = null
  if (userId) {
    // Try SECURITY DEFINER RPC first
    const { data: rpcRole, error: rpcError } = await supabase.rpc('get_my_role')
    if (!rpcError && rpcRole) {
      role = rpcRole as string
    } else {
      // Fallback direct query (own-profile RLS policy is non-recursive)
      const { data: profile } = await supabase
        .from('users').select('role').eq('id', userId).single()
      role = profile?.role ?? null
    }
  }

  const isAuthenticated = !!userId
  const safeRole        = role || 'student'

  // ── RULE 1: Logged-in users must never see guest-only pages ─────────────
  if (isAuthenticated && GUEST_ONLY_PATHS.includes(path)) {
    return NextResponse.redirect(new URL(`/${safeRole}/dashboard`, request.url))
  }

  // ── RULE 2: Guest users cannot access protected pages ───────────────────
  const isProtected = PROTECTED_PREFIXES.some(p => path.startsWith(p))
  if (!isAuthenticated && isProtected) {
    const url = new URL('/login', request.url)
    url.searchParams.set('redirect', path)
    return NextResponse.redirect(url)
  }

  // ── RULE 3: Role-based access control (admin can view all sections) ─────────────────────
  if (isAuthenticated && role) {
    // Only admins can access /admin
    if (path.startsWith('/admin') && role !== 'admin')
      return NextResponse.redirect(new URL(`/${role}/dashboard`, request.url))
    // Teachers can only access /teacher (not /student or /admin)
    if (path.startsWith('/teacher') && role === 'student')
      return NextResponse.redirect(new URL(`/student/dashboard`, request.url))
    // Students can only access /student (not /teacher or /admin)
    if (path.startsWith('/student') && role === 'teacher')
      return NextResponse.redirect(new URL(`/teacher/dashboard`, request.url))
    // Admin can freely visit /teacher and /student paths for monitoring
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|js|css|woff2?)$).*)',
  ],
}
