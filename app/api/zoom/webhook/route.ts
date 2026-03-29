/**
 * POST /api/zoom/webhook
 *
 * Handles incoming Zoom webhook events. This handler ONLY enqueues jobs —
 * it never uploads anything directly (avoids Vercel function timeout).
 *
 * Events handled:
 *   - endpoint.url_validation  → Zoom's one-time verification challenge
 *   - recording.completed      → Insert row in upload_jobs (status='pending')
 */

import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { verifyZoomWebhook } from '@/lib/zoom'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// Use service role to write to upload_jobs (RLS blocks anon)
function getAdminClient() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  // Read raw body as text (needed for signature verification)
  const rawBody   = await request.text()
  const timestamp = request.headers.get('x-zm-request-timestamp') || ''
  const signature = request.headers.get('x-zm-signature')         || ''

  let payload: any
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const event = payload.event as string

  // ── 1. URL Validation (Zoom verifies the endpoint on setup) ────────────────
  if (event === 'endpoint.url_validation') {
    const plainToken   = payload.payload?.plainToken || ''
    const secret       = process.env.ZOOM_WEBHOOK_SECRET_TOKEN!
    const encryptedToken = crypto
      .createHmac('sha256', secret)
      .update(plainToken)
      .digest('hex')

    return NextResponse.json({
      plainToken,
      encryptedToken,
    })
  }

  // ── From here on: verify HMAC signature ───────────────────────────────────
  if (!timestamp || !signature) {
    return NextResponse.json({ error: 'Missing signature headers' }, { status: 401 })
  }

  const isValid = verifyZoomWebhook(timestamp, rawBody, signature)
  if (!isValid) {
    console.warn('Zoom webhook: invalid signature')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // ── 2. Recording Completed → Enqueue upload job ────────────────────────────
  if (event === 'recording.completed') {
    const meetingId: string = String(payload.payload?.object?.id || '')

    // Find the MP4 recording file (prefer shared_screen_with_speaker_view)
    const recordingFiles: any[] = payload.payload?.object?.recording_files || []
    const mp4File = recordingFiles.find(
      (f: any) => f.file_type === 'MP4' && f.status === 'completed'
    ) || recordingFiles.find((f: any) => f.file_type === 'MP4')

    if (!mp4File) {
      console.log(`Zoom webhook: no MP4 found for meeting ${meetingId}`)
      return NextResponse.json({ received: true, note: 'No MP4 recording found' })
    }

    const downloadUrl   = mp4File.download_url as string
    const downloadToken = payload.download_token as string  // Zoom's temporary access token

    if (!downloadUrl || !downloadToken) {
      console.warn('Zoom webhook: missing download_url or download_token')
      return NextResponse.json({ received: true, note: 'Missing download credentials' })
    }

    const supabase = getAdminClient()

    // Look up the live class by zoom_meeting_id
    const { data: liveClass } = await supabase
      .from('live_classes')
      .select('id, title, status')
      .eq('zoom_meeting_id', meetingId)
      .single()

    if (!liveClass) {
      console.warn(`Zoom webhook: no live_class found for meeting ${meetingId}`)
      // Return 200 so Zoom doesn't retry — we just don't know this meeting
      return NextResponse.json({ received: true, note: 'Unknown meeting ID' })
    }

    // Insert upload job (status = 'pending') — worker will pick this up
    const { error: insertError } = await supabase.from('upload_jobs').insert({
      live_class_id:   liveClass.id,
      zoom_meeting_id: meetingId,
      download_url:    downloadUrl,
      download_token:  downloadToken,
      status:          'pending',
    })

    if (insertError) {
      console.error('Failed to insert upload_job:', insertError.message)
      // Return 500 so Zoom retries — we want this job to be created
      return NextResponse.json({ error: 'Failed to queue job' }, { status: 500 })
    }

    // Mark class as ended if still live
    if (liveClass.status === 'live') {
      await supabase
        .from('live_classes')
        .update({ status: 'ended', end_time: new Date().toISOString() })
        .eq('id', liveClass.id)
    }

    console.log(`✅ Upload job queued for live_class ${liveClass.id} (meeting ${meetingId})`)
    return NextResponse.json({ received: true, queued: true })
  }

  // Unknown event — acknowledge but ignore
  return NextResponse.json({ received: true, event })
}
