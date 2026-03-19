import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/assignments?classId=xxx
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const classId = request.nextUrl.searchParams.get('classId')
    let query = supabase
      .from('assignments')
      .select('id, title, description, due_date, max_score, file_url, class_id, teacher_id, created_at, classes(class_name, courses(name))')
      .order('created_at', { ascending: false })

    if (classId) query = query.eq('class_id', classId)

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

    const { title, description, due_date, max_score, class_id, file_url } = await request.json()
    if (!title || !due_date || !class_id) {
      return NextResponse.json({ error: 'title, due_date and class_id are required' }, { status: 400 })
    }

    const { data, error } = await supabase.from('assignments').insert({
      title,
      description,
      due_date,
      max_score: max_score || 100,
      class_id,
      teacher_id: user.id,
      file_url: file_url || null,
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    // Notify students: get class name for notification message
    try {
      const { data: cls } = await supabase.from('classes').select('class_name, course_id').eq('id', class_id).single()
      if (cls) {
        await supabase.from('notifications').insert({
          title: `New Assignment: ${title}`,
          message: `A new assignment has been posted in ${cls.class_name}. Due ${new Date(due_date).toLocaleDateString()}.`,
          type: 'assignment',
          sender_id: user.id,
          class_id: class_id,
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

    const { error } = await supabase.from('assignments').delete().eq('id', id).eq('teacher_id', user.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
