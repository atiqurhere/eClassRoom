import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const classId = request.nextUrl.searchParams.get('classId')
    let query = supabase.from('schedules').select('id, class_id, course_id, day, start_time, end_time, courses(name), classes(class_name)').order('day').order('start_time')
    if (classId) query = query.eq('class_id', classId)
    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ schedules: data })
  } catch { return NextResponse.json({ error: 'Internal server error' }, { status: 500 }) }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: role } = await supabase.rpc('get_my_role')
    if (role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // v2: schedules has no course_id column — only class_id
    const { class_id, day, start_time, end_time } = await request.json()
    if (!class_id || !day || !start_time || !end_time) {
      return NextResponse.json({ error: 'class_id, day, start_time and end_time are required' }, { status: 400 })
    }

    const { createClient: createAdmin } = await import('@supabase/supabase-js')
    const adminClient = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { data, error } = await adminClient.from('schedules').insert({ class_id, day, start_time, end_time }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ schedule: data })
  } catch { return NextResponse.json({ error: 'Internal server error' }, { status: 500 }) }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: role } = await supabase.rpc('get_my_role')
    if (role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const id = request.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const { createClient: createAdmin } = await import('@supabase/supabase-js')
    const adminClient = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { error } = await adminClient.from('schedules').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true })
  } catch { return NextResponse.json({ error: 'Internal server error' }, { status: 500 }) }
}
