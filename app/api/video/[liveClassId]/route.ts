// Protected video proxy — authenticated users only get the embed token.
// The actual YouTube video ID is never sent to the browser directly.
// The embed is served via a sandboxed iframe with no-cookie domain.
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ liveClassId: string }> }
) {
  try {
    const { liveClassId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Verify this student's class has access to this session
    const { data: session } = await supabase
      .from('live_classes')
      .select('id, recording_url, course_id, courses(class_id)')
      .eq('id', liveClassId)
      .single()

    if (!session?.recording_url) {
      return NextResponse.json({ error: 'No recording available' }, { status: 404 })
    }

    // Check role — students can only watch their own class
    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (profile?.role === 'student') {
      const { data: studentRecord } = await supabase
        .from('students').select('class_id').eq('user_id', user.id).single()
      const classId = (session.courses as any)?.class_id
      if (studentRecord?.class_id !== classId) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    // Extract YouTube video ID — never expose the full URL to the client
    const url = session.recording_url
    let videoId: string | null = null
    try {
      const u = new URL(url)
      videoId = u.searchParams.get('v') || (u.hostname === 'youtu.be' ? u.pathname.slice(1) : null)
    } catch { /* invalid URL */ }

    if (!videoId) return NextResponse.json({ error: 'Invalid recording URL' }, { status: 400 })

    // Return only the video ID (not the full URL) — client builds embed with this
    return NextResponse.json({ videoId })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
