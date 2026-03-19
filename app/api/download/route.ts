import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/download?url=<encoded_supabase_url>&filename=<name>
 *
 * Proxy download endpoint — fetches files from Supabase Storage using the
 * service-role key (bypasses RLS / bucket auth) and streams it back with
 * a Content-Disposition header so the browser saves or previews the file.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const fileUrl  = searchParams.get('url')
  const filename = searchParams.get('filename') || 'download'

  if (!fileUrl) {
    return NextResponse.json({ error: 'url param is required' }, { status: 400 })
  }

  // Validate the URL is from our Supabase project
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  let supabaseHostname: string | null = null
  try {
    supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : null
  } catch { /* ignore */ }

  let targetUrl: URL
  try {
    targetUrl = new URL(fileUrl)
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  if (supabaseHostname && targetUrl.hostname !== supabaseHostname) {
    return NextResponse.json({ error: 'Forbidden: external URL' }, { status: 403 })
  }

  try {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

    // Normalise the fetch URL:
    // - `/storage/v1/object/public/<bucket>/<path>`   → use as-is (public)
    // - `/storage/v1/object/authenticated/<bucket>/<path>` → use as-is
    // - CDN/short URL that doesn't match above → convert to authenticated endpoint
    let fetchUrl = fileUrl

    // Ensure we always hit the storage v1 API with service-role auth
    const pathname = targetUrl.pathname
    if (pathname.includes('/object/public/')) {
      // Replace public with authenticated so the service key can access private buckets too
      fetchUrl = fileUrl.replace('/object/public/', '/object/authenticated/')
    } else if (!pathname.includes('/object/authenticated/') && !pathname.includes('/storage/v1/')) {
      // Unknown/CDN URL — try fetching as-is (it may just be a plain public URL)
      fetchUrl = fileUrl
    }

    const headers: Record<string, string> = {
      'User-Agent': 'E-Classroom/1.0',
    }
    if (serviceKey) {
      headers['Authorization'] = `Bearer ${serviceKey}`
      headers['apikey']        = serviceKey
    }

    const upstream = await fetch(fetchUrl, { headers })

    if (!upstream.ok) {
      // Fallback: try the original URL without modification
      if (fetchUrl !== fileUrl) {
        const fallback = await fetch(fileUrl, { headers })
        if (fallback.ok) {
          const body        = await fallback.arrayBuffer()
          const contentType = fallback.headers.get('content-type') || 'application/octet-stream'
          return new NextResponse(body, {
            status: 200,
            headers: {
              'Content-Type':        contentType,
              'Content-Disposition': `inline; filename="${encodeURIComponent(filename)}"`,
              'Cache-Control':       'private, max-age=3600',
              'Access-Control-Allow-Origin': '*',
            },
          })
        }
      }
      return NextResponse.json(
        { error: `Upstream error: ${upstream.status} ${upstream.statusText}` },
        { status: upstream.status },
      )
    }

    const body        = await upstream.arrayBuffer()
    const contentType = upstream.headers.get('content-type') || 'application/octet-stream'

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type':        contentType,
        'Content-Disposition': `inline; filename="${encodeURIComponent(filename)}"`,
        'Cache-Control':       'private, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (err: any) {
    console.error('[download proxy] error:', err)
    return NextResponse.json({ error: 'Proxy error: ' + err.message }, { status: 500 })
  }
}
