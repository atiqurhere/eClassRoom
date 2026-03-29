/**
 * worker/index.js
 * Main polling loop — runs continuously on Railway.
 *
 * Flow:
 *   1. Every POLL_INTERVAL_MS, check upload_jobs for 'pending' rows
 *   2. Claim a job atomically (set status='processing')
 *   3. Stream Zoom recording → YouTube
 *   4. Update DB: status='done', youtube_url + live_classes.recording_url
 *   5. On failure: retry up to MAX_RETRIES, then mark 'failed'
 */

require('dotenv').config()  // Load .env in local dev (Railway injects env vars directly)

const { createClient }          = require('@supabase/supabase-js')
const { getZoomRecordingStream } = require('./lib/zoom')
const { uploadVideoFromStream }  = require('./lib/youtube')

const POLL_INTERVAL_MS = parseInt(process.env.POLL_INTERVAL_MS || '30000', 10)
const MAX_RETRIES      = parseInt(process.env.MAX_RETRIES      || '3',     10)

// ── Supabase admin client (service role) ──────────────────────────────────────
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

// ── Main processing function ──────────────────────────────────────────────────
async function processNextJob() {
  // Atomically claim a pending job
  // We use a two-step approach: fetch then immediately update to 'processing'
  const { data: jobs, error: fetchErr } = await supabase
    .from('upload_jobs')
    .select('*')
    .eq('status', 'pending')
    .lt('attempt_count', MAX_RETRIES)
    .order('created_at', { ascending: true })
    .limit(1)

  if (fetchErr) {
    console.error('[Worker] Supabase fetch error:', fetchErr.message)
    return
  }

  if (!jobs || jobs.length === 0) return  // Nothing to do

  const job = jobs[0]
  console.log(`\n[Worker] Picked up job ${job.id} for live_class ${job.live_class_id}`)

  // Claim it — set status to 'processing' to prevent duplicate pickup
  const { error: claimErr } = await supabase
    .from('upload_jobs')
    .update({
      status:        'processing',
      attempt_count: job.attempt_count + 1,
      updated_at:    new Date().toISOString(),
    })
    .eq('id', job.id)
    .eq('status', 'pending')   // Only claim if still pending (safe against race)

  if (claimErr) {
    console.warn('[Worker] Could not claim job (race condition, skipping):', claimErr.message)
    return
  }

  try {
    // ── 1. Fetch live class details for video title/description ──────────────
    const { data: liveClass } = await supabase
      .from('live_classes')
      .select('id, title, teacher_id, classes(class_name, courses(name)), users!live_classes_teacher_id_fkey(full_name)')
      .eq('id', job.live_class_id)
      .single()

    const classTitle   = liveClass?.title || 'Live Class'
    const courseName   = liveClass?.classes?.courses?.name   || ''
    const teacherName  = liveClass?.users?.full_name          || ''
    const date         = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

    const videoTitle       = `${classTitle} — ${date}`.substring(0, 100)
    const videoDescription = [
      courseName   ? `Course: ${courseName}`   : '',
      teacherName  ? `Teacher: ${teacherName}` : '',
      `Recorded: ${date}`,
      '',
      'This recording is private and available only to enrolled students.',
    ].filter(Boolean).join('\n')

    // ── 2. Get Zoom recording stream ─────────────────────────────────────────
    console.log('[Worker] Fetching Zoom recording stream...')
    const { stream, contentLength } = await getZoomRecordingStream(
      job.download_url,
      job.download_token
    )

    // ── 3. Stream → YouTube ──────────────────────────────────────────────────
    const youtubeUrl = await uploadVideoFromStream(
      stream,
      contentLength,
      videoTitle,
      videoDescription
    )

    // ── 4. Update both tables on success ─────────────────────────────────────
    await Promise.all([
      supabase
        .from('upload_jobs')
        .update({ status: 'done', youtube_url: youtubeUrl, updated_at: new Date().toISOString() })
        .eq('id', job.id),
      supabase
        .from('live_classes')
        .update({ recording_url: youtubeUrl })
        .eq('id', job.live_class_id),
    ])

    console.log(`[Worker] ✅ Done! YouTube URL: ${youtubeUrl}`)

  } catch (err) {
    console.error(`[Worker] ❌ Job ${job.id} failed (attempt ${job.attempt_count + 1}/${MAX_RETRIES}):`, err.message)

    const isLastAttempt = (job.attempt_count + 1) >= MAX_RETRIES
    const newStatus     = isLastAttempt ? 'failed' : 'pending'

    await supabase
      .from('upload_jobs')
      .update({
        status:        newStatus,
        error_message: err.message?.substring(0, 1000),
        updated_at:    new Date().toISOString(),
      })
      .eq('id', job.id)

    if (isLastAttempt) {
      console.error(`[Worker] Job ${job.id} permanently failed after ${MAX_RETRIES} attempts.`)
    } else {
      console.log(`[Worker] Job ${job.id} reset to 'pending' for retry.`)
    }
  }
}

// ── Polling loop ──────────────────────────────────────────────────────────────
async function run() {
  console.log('🚀 eClassRoom Upload Worker started')
  console.log(`   Poll interval : ${POLL_INTERVAL_MS / 1000}s`)
  console.log(`   Max retries   : ${MAX_RETRIES}`)
  console.log(`   Supabase URL  : ${process.env.SUPABASE_URL}`)
  console.log('')

  // Verify Supabase connection
  const { error: connErr } = await supabase.from('upload_jobs').select('id').limit(1)
  if (connErr) {
    console.error('❌ Cannot connect to Supabase:', connErr.message)
    process.exit(1)
  }
  console.log('✅ Supabase connection OK\n')

  // First poll immediately, then repeat
  await processNextJob()

  setInterval(async () => {
    try {
      await processNextJob()
    } catch (err) {
      console.error('[Worker] Unhandled error in poll cycle:', err)
    }
  }, POLL_INTERVAL_MS)
}

// ── Graceful shutdown ─────────────────────────────────────────────────────────
process.on('SIGTERM', () => {
  console.log('\n[Worker] SIGTERM received — shutting down gracefully')
  process.exit(0)
})
process.on('SIGINT', () => {
  console.log('\n[Worker] SIGINT received — shutting down')
  process.exit(0)
})

run().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
