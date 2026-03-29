import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/live-class/recording?liveClassId=<uuid>
 * Returns the upload job status + YouTube URL for a given live class.
 * Teachers and students can poll this to know when the recording is ready.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase   = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const liveClassId = request.nextUrl.searchParams.get('liveClassId')
    if (!liveClassId) return NextResponse.json({ error: 'liveClassId query param required' }, { status: 400 })

    // Fetch the live class (recording_url is stored here on success)
    const { data: liveClass } = await supabase
      .from('live_classes')
      .select('id, recording_url, status')
      .eq('id', liveClassId)
      .single()

    if (!liveClass) return NextResponse.json({ error: 'Live class not found' }, { status: 404 })

    // If recording_url already stored — done
    if (liveClass.recording_url) {
      return NextResponse.json({
        status:      'done',
        youtube_url: liveClass.recording_url,
      })
    }

    // Otherwise check the upload_jobs table for granular status
    // (Uses service role to bypass RLS on upload_jobs)
    const { createClient: createServiceClient } = await import('@/lib/supabase/server')
    const adminClient = await createServiceClient()

    const { data: job } = await adminClient
      .from('upload_jobs')
      .select('status, youtube_url, error_message, attempt_count')
      .eq('live_class_id', liveClassId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!job) {
      return NextResponse.json({
        status:  liveClass.status === 'ended' ? 'awaiting_zoom' : 'live',
        message: liveClass.status === 'ended'
          ? 'Zoom is processing the recording. Check back in a few minutes.'
          : 'Class is still live.',
      })
    }

    return NextResponse.json({
      status:        job.status,
      youtube_url:   job.youtube_url  || null,
      error_message: job.error_message || null,
      attempt_count: job.attempt_count,
    })
  } catch (err) {
    console.error('Recording status error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
