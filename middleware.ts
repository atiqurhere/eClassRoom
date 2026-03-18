import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// ── Simple in-memory rate limiter (per IP, resets on cold-start) ──────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_MAX    = 10
const RATE_LIMIT_WINDOW = 60_000 // 1 minute

function isRateLimited(ip: string): boolean {
  const now   = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return false
  }
  if (entry.count >= RATE_LIMIT_MAX) return true
  entry.count++
  return false
}

// Pages that are ONLY for guests (must redirect logged-in users away)
const GUEST_ONLY_PATHS = ['/', '/login', '/signup', '/forgot-password', '/reset-password']

// Pages that require authentication
const PROTECTED_PREFIXES = ['/admin', '/teacher', '/student', '/profile', '/messages', '/notifications']

// Auth rate-limited paths
const RATE_LIMITED_PATHS = ['/api/auth/', '/signup']

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // ── Rate limit sensitive auth endpoints ───────────────────────────────
  if (RATE_LIMITED_PATHS.some(p => path.startsWith(p))) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || '127.0.0.1'
    if (isRateLimited(ip)) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests. Please wait a moment and try again.' }),
        { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': '60' } }
      )
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

  // ── Verify session (JWT-based, no extra DB call) ───────────────────────
  const { data: { user } } = await supabase.auth.getUser()

  // ── Get role via SECURITY DEFINER function (bypasses RLS, no recursion) ─
  // Falls back to direct query if the function hasn't been created in DB yet
  let role: string | null = null
  if (user) {
    const { data: rpcRole, error: rpcError } = await supabase.rpc('get_my_role')
    if (!rpcError && rpcRole) {
      role = rpcRole as string
    } else {
      // Fallback: direct table query. The "Users can view own profile" policy
      // (auth.uid()::uuid = id) is non-recursive and always grants self-access.
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()
      role = profile?.role ?? null
    }
  }

  const safeRole = role || 'student'

  // ──────────────────────────────────────────────────────────────────────
  // RULE 1: Authenticated users must NEVER see guest-only pages
  //         Always bounce them to their dashboard
  // ──────────────────────────────────────────────────────────────────────
  if (user && GUEST_ONLY_PATHS.includes(path)) {
    return NextResponse.redirect(new URL(`/${safeRole}/dashboard`, request.url))
  }

  // ──────────────────────────────────────────────────────────────────────
  // RULE 2: Unauthenticated users cannot access protected pages
  // ──────────────────────────────────────────────────────────────────────
  const isProtected = PROTECTED_PREFIXES.some(p => path.startsWith(p))
  if (!user && isProtected) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', path)
    return NextResponse.redirect(loginUrl)
  }

  // ──────────────────────────────────────────────────────────────────────
  // RULE 3: Role-based access control
  // ──────────────────────────────────────────────────────────────────────
  if (user && role) {
    if (path.startsWith('/admin')   && role !== 'admin')   return NextResponse.redirect(new URL(`/${role}/dashboard`, request.url))
    if (path.startsWith('/teacher') && role !== 'teacher') return NextResponse.redirect(new URL(`/${role}/dashboard`, request.url))
    if (path.startsWith('/student') && role !== 'student') return NextResponse.redirect(new URL(`/${role}/dashboard`, request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|js|css|woff2?)$).*)',
  ],
}
