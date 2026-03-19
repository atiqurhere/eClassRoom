import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/enrollments?course_id=xxx — list enrolled students for a course
// POST /api/enrollments — enroll student(s) in a course
// DELETE /api/enrollments?course_id=xxx&student_id=xxx — unenroll

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const courseId = request.nextUrl.searchParams.get('course_id')
    let query = supabase
      .from('course_enrollments')
      .select('*, student:users!course_enrollments_student_id_fkey(id, full_name, email, avatar_url), course:courses(id, name)')
      .order('enrolled_at', { ascending: false })

    if (courseId) query = query.eq('course_id', courseId)
    else query = query.eq('student_id', user.id) // student viewing own enrollments

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ enrollments: data || [] })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: me } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (me?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { course_id, student_ids } = await request.json()
    if (!course_id || !student_ids?.length) return NextResponse.json({ error: 'course_id and student_ids required' }, { status: 400 })

    const rows = (student_ids as string[]).map(sid => ({
      course_id, student_id: sid, enrolled_by: user.id,
    }))

    const { data, error } = await supabase
      .from('course_enrollments')
      .upsert(rows, { onConflict: 'course_id,student_id', ignoreDuplicates: true })
      .select()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ enrolled: data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: me } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (me?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const courseId  = request.nextUrl.searchParams.get('course_id')
    const studentId = request.nextUrl.searchParams.get('student_id')
    if (!courseId || !studentId) return NextResponse.json({ error: 'course_id and student_id required' }, { status: 400 })

    const { error } = await supabase
      .from('course_enrollments')
      .delete()
      .eq('course_id', courseId)
      .eq('student_id', studentId)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
