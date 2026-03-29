/**
 * worker/lib/youtube.js
 * YouTube Data API v3 — OAuth 2.0 refresh + resumable upload.
 * Streams from Zoom directly to YouTube without touching disk.
 */

const { google } = require('googleapis')

// ── OAuth2 client ─────────────────────────────────────────────────────────────
function getOAuth2Client() {
  const client = new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET,
  )
  client.setCredentials({
    refresh_token: process.env.YOUTUBE_REFRESH_TOKEN,
  })
  return client
}

/**
 * Uploads a readable stream directly to YouTube as a private video.
 *
 * @param {import('stream').Readable} stream        - Zoom recording stream
 * @param {number}                    contentLength - File size in bytes (from Content-Length header)
 * @param {string}                    title         - Video title
 * @param {string}                    description   - Video description
 * @returns {Promise<string>}                       - YouTube video URL
 */
async function uploadVideoFromStream(stream, contentLength, title, description) {
  const auth    = getOAuth2Client()
  const youtube = google.youtube({ version: 'v3', auth })

  console.log(`[YouTube] Starting upload: "${title}" (${Math.round(contentLength / 1024 / 1024)} MB)`)

  const response = await youtube.videos.insert(
    {
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title:       title.substring(0, 100),   // YouTube max = 100 chars
          description: description.substring(0, 5000),
          categoryId:  '27',                      // Education category
        },
        status: {
          privacyStatus: 'private',               // Always private
        },
      },
      media: {
        mimeType: 'video/mp4',
        body:     stream,
      },
    },
    {
      // googleapis will use resumable upload automatically for large files
      onUploadProgress: (evt) => {
        if (contentLength > 0) {
          const pct = Math.round((evt.bytesRead / contentLength) * 100)
          if (pct % 10 === 0) console.log(`[YouTube] Upload progress: ${pct}%`)
        }
      },
    }
  )

  const videoId = response.data.id
  if (!videoId) throw new Error('YouTube upload succeeded but no video ID returned')

  const url = `https://www.youtube.com/watch?v=${videoId}`
  console.log(`[YouTube] Upload complete: ${url}`)
  return url
}

module.exports = { uploadVideoFromStream }
