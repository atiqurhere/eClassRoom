import { createClient } from '@/lib/supabase/server'
import { endZoomMeeting } from '@/lib/zoom'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { liveClassId } = await request.json()
    if (!liveClassId) return NextResponse.json({ error: 'liveClassId required' }, { status: 400 })

    // Fetch the live class to get zoom_meeting_id
    const { data: liveClass } = await supabase
      .from('live_classes')
      .select('id, zoom_meeting_id')
      .eq('id', liveClassId)
      .eq('teacher_id', user.id)
      .single()

    if (!liveClass) return NextResponse.json({ error: 'Live class not found' }, { status: 404 })

    // Mark as ended in DB
    const { error } = await supabase
      .from('live_classes')
      .update({ status: 'ended', end_time: new Date().toISOString() })
      .eq('id', liveClassId)
      .eq('teacher_id', user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Best-effort: also end via Zoom API (non-critical — Zoom auto-ends when host leaves)
    if (liveClass.zoom_meeting_id) {
      endZoomMeeting(liveClass.zoom_meeting_id).catch(err =>
        console.warn('Zoom end meeting (non-critical):', err?.message)
      )
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
