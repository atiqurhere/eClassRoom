import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    const role = profile?.role || 'student'

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .or(`user_id.eq.${user.id},target_role.eq.${role}`)
      .order('created_at', { ascending: false })
      .limit(50)

    return NextResponse.json({ notifications: data || [] })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (!['admin', 'teacher'].includes(profile?.role || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { title, message, type, targetRole, userId, classId } = await request.json()

    const notifData: any = {
      title,
      message,
      type: type || 'info',
      sender_id: user.id,
    }

    if (userId) {
      notifData.user_id = userId
    } else if (targetRole) {
      notifData.target_role = targetRole
    }

    const { error } = await supabase.from('notifications').insert(notifData)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id, markAll } = await request.json()

    if (markAll) {
      const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .or(`user_id.eq.${user.id},target_role.eq.${profile?.role}`)
    } else if (id) {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}