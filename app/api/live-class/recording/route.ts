import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

function toYouTubeEmbed(url: string): string | null {
  try {
    const u = new URL(url)
    const vid =
      u.searchParams.get('v') ||
      (u.hostname === 'youtu.be' ? u.pathname.slice(1) : null) ||
      (u.pathname.startsWith('/embed/') ? u.pathname.split('/embed/')[1] : null)
    return vid ? `https://www.youtube.com/embed/${vid}` : null
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { liveClassId, recording_url } = await request.json()
    if (!liveClassId || !recording_url) {
      return NextResponse.json({ error: 'liveClassId and recording_url required' }, { status: 400 })
    }

    // Validate YouTube URL
    const embed = toYouTubeEmbed(recording_url)
    if (!embed) {
      return NextResponse.json({ error: 'Please enter a valid YouTube URL (youtube.com/watch?v=... or youtu.be/...)' }, { status: 400 })
    }

    const { error } = await supabase
      .from('live_classes')
      .update({ recording_url })
      .eq('id', liveClassId)
      .eq('teacher_id', user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, embed })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
