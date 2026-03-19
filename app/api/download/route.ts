import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/download?url=<encoded_supabase_url>&filename=<name>&inline=<true|false>
 *
 * Proxy endpoint — fetches the file from Supabase Storage using the service-role key
 * (bypasses RLS / bucket visibility) and streams it back so the browser never sees
 * the raw Supabase URL.
 *
 * inline=true  → Content-Disposition: inline  (browser previews the file)
 * inline=false → Content-Disposition: attachment (browser downloads the file)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const fileUrl  = searchParams.get('url')
  const filename = searchParams.get('filename') || 'download'
  const inline   = searchParams.get('inline') === 'true'

  if (!fileUrl) {
    return NextResponse.json({ error: 'url param is required' }, { status: 400 })
  }

  // Security: only allow URLs from our Supabase project
  const supabaseUrl      = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  let supabaseHostname: string | null = null
  try { supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : null } catch { /* ignore */ }

  let targetUrl: URL
  try { targetUrl = new URL(fileUrl) } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  if (supabaseHostname && targetUrl.hostname !== supabaseHostname) {
    return NextResponse.json({ error: 'Forbidden: external URL' }, { status: 403 })
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  const authHeaders: Record<string, string> = {}
  if (serviceKey) {
    authHeaders['Authorization'] = `Bearer ${serviceKey}`
    authHeaders['apikey']        = serviceKey
  }

  // Derive fetch URL:
  // Supabase storage public endpoint:       /storage/v1/object/public/<bucket>/<path>
  // Supabase storage authenticated endpoint: /storage/v1/object/authenticated/<bucket>/<path>
  //
  // Using the authenticated endpoint with service-role key accesses BOTH public and private buckets.
  const pathname = targetUrl.pathname

  let fetchUrl: string
  if (pathname.includes('/object/public/')) {
    // Convert to authenticated endpoint so private buckets are accessible
    fetchUrl = fileUrl.replace('/object/public/', '/object/authenticated/')
  } else if (pathname.includes('/object/authenticated/')) {
    fetchUrl = fileUrl  // already authenticated endpoint
  } else {
    fetchUrl = fileUrl  // unknown format — try as-is
  }

  const tryFetch = async (url: string) => fetch(url, {
    headers: { 'User-Agent': 'E-Classroom/1.0', ...authHeaders },
  })

  let upstream = await tryFetch(fetchUrl)

  // Fallback: if authenticated endpoint fails, try original URL
  if (!upstream.ok && fetchUrl !== fileUrl) {
    upstream = await tryFetch(fileUrl)
  }

  if (!upstream.ok) {
    return NextResponse.json(
      { error: `Could not fetch file: ${upstream.status} ${upstream.statusText}` },
      { status: upstream.status },
    )
  }

  const body        = await upstream.arrayBuffer()
  const contentType = upstream.headers.get('content-type') || 'application/octet-stream'
  const disposition = inline
    ? `inline; filename="${encodeURIComponent(filename)}"`
    : `attachment; filename="${encodeURIComponent(filename)}"`

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type':              contentType,
      'Content-Disposition':       disposition,
      'Cache-Control':             'private, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
