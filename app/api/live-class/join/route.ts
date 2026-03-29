import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check user role (only students can join)
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'student') {
      return NextResponse.json({ error: 'Only students can join live classes' }, { status: 403 })
    }

    const body = await request.json()
    const { liveClassId } = body

    if (!liveClassId) {
      return NextResponse.json({ error: 'Live class ID is required' }, { status: 400 })
    }

    // Get student record
    const { data: studentRecord } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!studentRecord) {
      return NextResponse.json({ error: 'Student record not found' }, { status: 404 })
    }

    // Create attendance record
    const { data: attendance, error: attendanceError } = await supabase
      .from('attendance')
      .insert({
        live_class_id: liveClassId,
        student_id: studentRecord.id,
        join_time: new Date().toISOString(),
        status: 'present',
      })
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