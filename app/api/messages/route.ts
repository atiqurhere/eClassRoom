import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const otherId = searchParams.get('with')

    let query = supabase
      .from('messages')
      .select('*, sender:users!messages_sender_id_fkey(id, full_name, role)')
      .order('created_at', { ascending: true })
      .limit(100)

    if (otherId) {
      query = query.or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${user.id})`
      )
    } else {
      query = query.or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    }

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ messages: data || [] })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { receiverId, content } = await request.json()
    if (!receiverId || !content?.trim()) {
      return NextResponse.json({ error: 'receiverId and content are required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('messages')
      .insert({ sender_id: user.id, receiver_id: receiverId, content: content.trim() })
      .select('*, sender:users!messages_sender_id_fkey(id, full_name, role)')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ message: data })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
