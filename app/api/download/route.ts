import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/download?url=<encoded_supabase_url>&filename=<name>
 *
 * Proxy download endpoint — fetches the file from Supabase Storage using the
 * service-role key (bypassing RLS / bucket auth) and streams it back to the
 * browser with a `Content-Disposition: attachment` header so the browser saves
 * it as a file download.
 *
 * This prevents the raw Supabase URL from being exposed to the browser AND
 * avoids "Bucket not found" 404s that occur when the browser tries to hit
 * Supabase storage directly with an un-authenticated request.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const fileUrl  = searchParams.get('url')
  const filename = searchParams.get('filename') || 'download'

  if (!fileUrl) {
    return NextResponse.json({ error: 'url param is required' }, { status: 400 })
  }

  // Validate the URL is from our Supabase project (security: prevent open proxy abuse)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : null

  let targetUrl: URL
  try {
    targetUrl = new URL(fileUrl)
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  // Only allow downloads from our Supabase project
  if (supabaseHostname && targetUrl.hostname !== supabaseHostname) {
    return NextResponse.json({ error: 'Forbidden: external URL' }, { status: 403 })
  }

  try {
    // Fetch from Supabase — use service role key to bypass storage auth if needed
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const headers: Record<string, string> = {
      'User-Agent': 'E-Classroom/1.0',
    }
    if (serviceKey) {
      headers['Authorization'] = `Bearer ${serviceKey}`
      headers['apikey'] = serviceKey
    }

    // Convert public URLs to authenticated URLs so our Service Key can bypass RLS on private buckets (e.g., submissions)
    // The Supabase public endpoint ignores auth headers and rejects private paths with 404/400.
    const fetchUrl = fileUrl.replace('/object/public/', '/object/authenticated/')
    
    const upstream = await fetch(fetchUrl, { headers })

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream error: ${upstream.status} ${upstream.statusText}. URL: ${fetchUrl}` },
        { status: upstream.status }
      )
    }

    const contentType = upstream.headers.get('content-type') || 'application/octet-stream'
    const body = await upstream.arrayBuffer()

    // Check if inline view is requested
    const inline = searchParams.get('inline') === 'true'
    const disposition = inline ? 'inline' : 'attachment'
    const safe = filename.replace(/[^\w.\-]/g, '_')

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type':        contentType,
        'Content-Disposition': `${disposition}; filename="${safe}"`,
        'Content-Length':      String(body.byteLength),
        // Cache for 1 hour to avoid hammering Supabase
        'Cache-Control':       'private, max-age=3600',
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Download failed' }, { status: 500 })
  }
}
