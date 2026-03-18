import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/assignments?courseId=xxx
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const courseId = request.nextUrl.searchParams.get('courseId')
    let query = supabase
      .from('assignments')
      .select('id, title, description, due_date, max_score, file_url, course_id, teacher_id, created_at, courses(name, class_id, classes(class_name))')
      .order('created_at', { ascending: false })

    if (courseId) query = query.eq('course_id', courseId)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ assignments: data })
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/assignments
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: rpcRole } = await supabase.rpc('get_my_role')
    if (!['teacher', 'admin'].includes(rpcRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { title, description, due_date, max_score, course_id, file_url } = await request.json()
    if (!title || !due_date || !course_id) {
      return NextResponse.json({ error: 'title, due_date and course_id are required' }, { status: 400 })
    }

    const { data, error } = await supabase.from('assignments').insert({
      title,
      description,
      due_date,
      max_score: max_score || 100,
      course_id,
      teacher_id: user.id,
      file_url: file_url || null,
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    // Trigger notification to class students
    try {
      const { data: course } = await supabase.from('courses').select('class_id, name').eq('id', course_id).single()
      if (course) {
        await supabase.from('notifications').insert({
          title: `New Assignment: ${title}`,
          message: `A new assignment has been posted in ${course.name}. Due ${new Date(due_date).toLocaleDateString()}.`,
          type: 'assignment',
          sender_id: user.id,
          class_id: course.class_id,
        })
      }
    } catch { /* notification failure is non-fatal */ }

    return NextResponse.json({ assignment: data })
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/assignments?id=xxx
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const id = request.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Assignment ID required' }, { status: 400 })

    // Only the creating teacher or admin can delete
    const { error } = await supabase.from('assignments').delete().eq('id', id).eq('teacher_id', user.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
