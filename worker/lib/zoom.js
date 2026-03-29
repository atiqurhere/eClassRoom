/**
 * worker/lib/zoom.js
 * Zoom Server-to-Server OAuth token + recording download helper for the worker.
 */

const https = require('https')
const http  = require('http')

// ── Token cache ───────────────────────────────────────────────────────────────
let _cachedToken = null
let _tokenExpiry = 0

async function getZoomAccessToken() {
  if (_cachedToken && Date.now() < _tokenExpiry) return _cachedToken

  const accountId    = process.env.ZOOM_ACCOUNT_ID
  const clientId     = process.env.ZOOM_CLIENT_ID
  const clientSecret = process.env.ZOOM_CLIENT_SECRET

  if (!accountId || !clientId || !clientSecret) {
    throw new Error('Missing Zoom credentials')
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
  const url = `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`

  const res = await fetch(url, {
    method:  'POST',
    headers: { Authorization: `Basic ${credentials}` },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Zoom token error ${res.status}: ${text}`)
  }

  const data = await res.json()
  _cachedToken = data.access_token
  _tokenExpiry = Date.now() + (data.expires_in - 30) * 1000
  return _cachedToken
}

/**
 * Returns a Node.js readable stream of the Zoom recording MP4.
 * Handles redirects (Zoom download URLs redirect to S3).
 * Also returns the content-length header for YouTube resumable upload.
 */
async function getZoomRecordingStream(downloadUrl, downloadToken) {
  const axios = require('axios')

  const response = await axios.get(downloadUrl, {
    headers: {
      Authorization: `Bearer ${downloadToken}`,
    },
    responseType: 'stream',
    maxRedirects: 5,
    // Large file — no timeout on stream (set per-chunk timeout instead)
    timeout: 0,
  })

  const contentLength = parseInt(response.headers['content-length'] || '0', 10)
  return { stream: response.data, contentLength }
}

module.exports = { getZoomAccessToken, getZoomRecordingStream }
