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

    // Check user role (only teachers can start classes)
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'teacher') {
      return NextResponse.json({ error: 'Only teachers can start live classes' }, { status: 403 })
    }

    const body = await request.json()
    const { courseId, title } = body

    if (!courseId || !title) {
      return NextResponse.json({ error: 'Course ID and title are required' }, { status: 400 })
    }

    // Generate unique room ID
    const roomId = `class_${courseId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Create live class record
    const { data: liveClass, error: createError } = await supabase
      .from('live_classes')
      .insert({
        course_id: courseId,
        teacher_id: user.id,
        room_id: roomId,
        title,
        start_time: new Date().toISOString(),
        status: 'live',
      })
      .select()
      .single()

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 })
    }

    // Create notification for students
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        title: 'Live Class Started',
        message: `${title} has started. Join now!`,
        type: 'class_start',
        sender_id: user.id,
        target_role: 'student',
        link: `/student/live-class/${liveClass.id}`,
      })

    if (notificationError) {
      console.error('Failed to create notification:', notificationError)
    }

    return NextResponse.json({ liveClass })
  } catch (error) {
    console.error('Error starting live class:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}