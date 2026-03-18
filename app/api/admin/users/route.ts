import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: admin } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (admin?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { full_name, email, password, role, student_id } = await request.json()

    // Use Service Role key to create user (needs SUPABASE_SERVICE_ROLE_KEY set)
    const { createClient: createAdmin } = await import('@supabase/supabase-js')
    const adminClient = createAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Create auth user
    const { data: newAuth, error: authErr } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role },
    })
    if (authErr) return NextResponse.json({ error: authErr.message }, { status: 400 })

    // Insert into public.users
    const { error: profileErr } = await adminClient.from('users').insert({
      id: newAuth.user.id,
      email,
      full_name,
      role,
    })
    if (profileErr) return NextResponse.json({ error: profileErr.message }, { status: 400 })

    // If student, create student record
    if (role === 'student' && student_id) {
      await adminClient.from('students').insert({
        user_id: newAuth.user.id,
        student_id,
      })
    }

    return NextResponse.json({ user: newAuth.user })
  } catch (err: any) {
    console.error('Create user error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: admin } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (admin?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const userId = request.nextUrl.searchParams.get('id')
    if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 400 })

    const { createClient: createAdmin } = await import('@supabase/supabase-js')
    const adminClient = createAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error } = await adminClient.auth.admin.deleteUser(userId)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
