/**
 * lib/zoom.ts
 * Zoom Server-to-Server OAuth helper for Next.js (Vercel).
 * Used by: /api/live-class/start, /api/zoom/webhook
 */

import crypto from 'crypto'

const ZOOM_TOKEN_URL = 'https://zoom.us/oauth/token'
const ZOOM_API_BASE  = 'https://api.zoom.us/v2'

// ── Token cache (in-process, resets on cold start — fine for serverless) ──────
let _cachedToken: string | null = null
let _tokenExpiry: number        = 0

export async function getZoomAccessToken(): Promise<string> {
  if (_cachedToken && Date.now() < _tokenExpiry) return _cachedToken

  const accountId     = process.env.ZOOM_ACCOUNT_ID!
  const clientId      = process.env.ZOOM_CLIENT_ID!
  const clientSecret  = process.env.ZOOM_CLIENT_SECRET!

  if (!accountId || !clientId || !clientSecret) {
    throw new Error('Missing Zoom credentials (ZOOM_ACCOUNT_ID / ZOOM_CLIENT_ID / ZOOM_CLIENT_SECRET)')
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const res = await fetch(
    `${ZOOM_TOKEN_URL}?grant_type=account_credentials&account_id=${accountId}`,
    {
      method: 'POST',
      headers: { Authorization: `Basic ${credentials}` },
    }
  )

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Zoom token error ${res.status}: ${text}`)
  }

  const data = await res.json()
  _cachedToken = data.access_token as string
  // Expire 30s early to avoid edge-case expiry during request
  _tokenExpiry = Date.now() + (data.expires_in - 30) * 1000
  return _cachedToken!
}

// ── Meeting creation ──────────────────────────────────────────────────────────

export interface ZoomMeeting {
  meeting_id: string
  join_url:   string
  start_url:  string
}

/**
 * Creates a Zoom meeting for a live class.
 * auto_recording = 'cloud' ensures Zoom records to the cloud automatically.
 */
export async function createZoomMeeting(
  topic:           string,
  durationMinutes: number = 90,
): Promise<ZoomMeeting> {
  const token     = await getZoomAccessToken()
  const accountId = process.env.ZOOM_ACCOUNT_ID!

  const body = {
    topic,
    type:     2,   // Scheduled meeting
    duration: durationMinutes,
    settings: {
      host_video:        true,
      participant_video:  true,
      join_before_host:  false,
      mute_upon_entry:   true,
      auto_recording:    'cloud',   // ← key: Zoom auto-starts cloud recording
      waiting_room:      false,
    },
  }

  const res = await fetch(`${ZOOM_API_BASE}/users/${accountId}/meetings`, {
    method:  'POST',
    headers: {
      Authorization:  `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Zoom create meeting error ${res.status}: ${text}`)
  }

  const data = await res.json()
  return {
    meeting_id: String(data.id),
    join_url:   data.join_url,
    start_url:  data.start_url,
  }
}

/**
 * Ends a Zoom meeting via API (optional — Zoom also ends when host leaves).
 */
export async function endZoomMeeting(meetingId: string): Promise<void> {
  const token = await getZoomAccessToken()
  await fetch(`${ZOOM_API_BASE}/meetings/${meetingId}/status`, {
    method:  'PUT',
    headers: {
      Authorization:  `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action: 'end' }),
  })
  // Non-critical — ignore errors (meeting may already be ended)
}

// ── Webhook signature verification ───────────────────────────────────────────

/**
 * Verifies a Zoom webhook request using HMAC-SHA256.
 * Zoom sends: zoom-signature header = v0=<hex>
 * We reconstruct: "v0:{timestamp}:{rawBody}" → HMAC-SHA256 with WEBHOOK_SECRET_TOKEN
 */
export function verifyZoomWebhook(
  timestamp:   string,
  rawBody:     string,
  signature:   string,
): boolean {
  const secret = process.env.ZOOM_WEBHOOK_SECRET_TOKEN
  if (!secret) throw new Error('Missing ZOOM_WEBHOOK_SECRET_TOKEN')

  const message  = `v0:${timestamp}:${rawBody}`
  const expected = 'v0=' + crypto.createHmac('sha256', secret).update(message).digest('hex')

  // Timing-safe comparison
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  } catch {
    return false
  }
}
