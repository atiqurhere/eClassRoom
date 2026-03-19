import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET  ?classId=...  — fetch materials for a class (or all for teacher)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const classId = request.nextUrl.searchParams.get('classId')
    let query = supabase
      .from('materials')
      .select('id, title, file_url, file_type, class_id, teacher_id, created_at, classes(class_name, courses(name))')
      .order('created_at', { ascending: false })

    if (classId) query = query.eq('class_id', classId)
    else query = query.eq('teacher_id', user.id) // teacher sees only own materials

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ materials: data })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST — save material record after upload (class_id based)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { title, file_url, file_type, class_id } = await request.json()
    if (!title || !file_url || !class_id) {
      return NextResponse.json({ error: 'title, file_url and class_id are required' }, { status: 400 })
    }

    const { data, error } = await supabase.from('materials').insert({
      title,
      file_url,
      file_type: file_type || 'file',
      class_id,
      teacher_id: user.id,
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ material: data })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE ?id=...
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const id = request.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const { error } = await supabase.from('materials').delete().eq('id', id).eq('teacher_id', user.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
