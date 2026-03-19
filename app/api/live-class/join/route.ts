import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // v2 schema: role stored directly on users table, no separate students table
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'student') {
      return NextResponse.json({ error: 'Only students can join via this endpoint' }, { status: 403 })
    }

    const body = await request.json()
    const { liveClassId } = body

    if (!liveClassId) {
      return NextResponse.json({ error: 'Live class ID is required' }, { status: 400 })
    }

    // v2: student_id = user.id directly (no separate students table)
    const { data: attendance, error: attendanceError } = await supabase
      .from('attendance')
      .upsert({
        live_class_id: liveClassId,
        student_id:    user.id,
        join_time:     new Date().toISOString(),
        status:        'present',
      }, { onConflict: 'live_class_id,student_id' })
      .select()
      .single()

    if (attendanceError) {
      return NextResponse.json({ error: attendanceError.message }, { status: 500 })
    }

    return NextResponse.json({ attendance })
  } catch (error) {
    console.error('Error joining live class:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}