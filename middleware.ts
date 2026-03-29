import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // Redirect authenticated users away from auth pages
  if (user && (path === '/login' || path === '/signup')) {
    // Get user role and redirect to appropriate dashboard
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile) {
      return NextResponse.redirect(new URL(`/${profile.role}/dashboard`, request.url))
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Protect dashboard routes - require authentication
  if (
    !user &&
    (path.startsWith('/admin') ||
      path.startsWith('/teacher') ||
      path.startsWith('/student') ||
      path.startsWith('/profile'))
  ) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Role-based access control
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile) {
      const { role } = profile

      // Admin-only routes
      if (path.startsWith('/admin') && role !== 'admin') {
        return NextResponse.redirect(new URL(`/${role}/dashboard`, request.url))
      }

      // Teacher-only routes
      if (path.startsWith('/teacher') && role !== 'teacher') {
        return NextResponse.redirect(new URL(`/${role}/dashboard`, request.url))
      }

      // Student-only routes
      if (path.startsWith('/student') && role !== 'student') {
        return NextResponse.redirect(new URL(`/${role}/dashboard`, request.url))
      }

      // Redirect root to appropriate dashboard
      if (path === '/') {
        return NextResponse.redirect(new URL(`/${role}/dashboard`, request.url))
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/signup',
    '/admin/:path*',
    '/teacher/:path*',
    '/student/:path*',
    '/profile/:path*',
  ],
}
