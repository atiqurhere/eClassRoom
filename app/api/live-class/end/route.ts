import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { liveClassId } = await request.json()
    if (!liveClassId) return NextResponse.json({ error: 'liveClassId required' }, { status: 400 })

    const { error } = await supabase
      .from('live_classes')
      .update({ status: 'ended', end_time: new Date().toISOString() })
      .eq('id', liveClassId)
      .eq('teacher_id', user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
