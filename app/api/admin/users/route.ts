import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: admin } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (admin?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { full_name, email, password, role, student_id } = body

    // Server-side validation
    if (!full_name?.trim()) return NextResponse.json({ error: 'Full name is required' }, { status: 400 })
    if (!email?.trim())     return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    if (!password || password.length < 6) return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    if (!role)              return NextResponse.json({ error: 'Role is required' }, { status: 400 })

    // Check service role key is available
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not set!')
      return NextResponse.json({ error: 'Server configuration error: missing service role key. Set SUPABASE_SERVICE_ROLE_KEY in Vercel environment variables.' }, { status: 500 })
    }

    const { createClient: createAdmin } = await import('@supabase/supabase-js')
    const adminClient = createAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Create auth user
    const { data: newAuth, error: authErr } = await adminClient.auth.admin.createUser({
      email: email.trim(),
      password,
      email_confirm: true,
      user_metadata: { full_name: full_name.trim(), role },
    })
    if (authErr) {
      console.error('Supabase createUser error:', authErr)
      return NextResponse.json({ error: authErr.message }, { status: 400 })
    }

    // Upsert into public.users — use upsert in case a trigger already created the row
    // (some Supabase setups auto-create the profile row via handle_new_user trigger)
    const upsertPayload: Record<string, any> = {
      id: newAuth.user.id,
      email: email.trim(),
      full_name: full_name.trim(),
      role,
    }
    if (role === 'student' && student_id) {
      upsertPayload.student_id = student_id.trim()
    }

    const { error: profileErr } = await adminClient
      .from('users')
      .upsert(upsertPayload, { onConflict: 'id' })

    if (profileErr) {
      console.error('Profile upsert error:', profileErr)
      // Clean up the auth user if profile creation fails
      await adminClient.auth.admin.deleteUser(newAuth.user.id).catch(() => {})
      return NextResponse.json({ error: `Database error: ${profileErr.message}` }, { status: 400 })
    }

    return NextResponse.json({ user: newAuth.user })
  } catch (err: any) {
    console.error('Create user error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
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

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Server configuration error: missing service role key' }, { status: 500 })
    }

    const { createClient: createAdmin } = await import('@supabase/supabase-js')
    const adminClient = createAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error } = await adminClient.auth.admin.deleteUser(userId)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
