import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (!profile || profile.role !== 'teacher') {
      return NextResponse.json({ error: 'Only teachers can start live classes' }, { status: 403 })
    }

    const body = await request.json()
    // Support both classId (new) and courseId (legacy fallback)
    const { classId, courseId, title } = body

    if (!classId && !courseId) {
      return NextResponse.json({ error: 'classId or courseId and title are required' }, { status: 400 })
    }
    if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 })

    // If classId provided, verify teacher is assigned to that class
    if (classId) {
      const { data: cls } = await supabase.from('classes').select('id, teacher_id').eq('id', classId).single()
      if (!cls) return NextResponse.json({ error: 'Class not found' }, { status: 404 })
      if (cls.teacher_id !== user.id) return NextResponse.json({ error: 'You are not assigned to this class' }, { status: 403 })
    }

    const roomId = `class_${(classId || courseId)}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const { data: liveClass, error: createError } = await supabase
      .from('live_classes')
      .insert({
        class_id:   classId  || null,
        teacher_id: user.id,
        room_id:    roomId,
        title,
        start_time: new Date().toISOString(),
        status:     'live',
      })
      .select()
      .single()

    if (createError) return NextResponse.json({ error: createError.message }, { status: 500 })

    // Notify students enrolled in the course that owns this class
    if (classId) {
      await supabase.from('notifications').insert({
        title:       'Live Class Started',
        message:     `${title} has started — join now!`,
        type:        'class_start',
        sender_id:   user.id,
        target_role: 'student',
        link:        `/student/live-class/${liveClass.id}`,
      })
    }

    return NextResponse.json({ liveClass })
  } catch (error) {
    console.error('Error starting live class:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}