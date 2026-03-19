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
      .select('*, sender:users!messages_sender_id_fkey(id, full_name, role, avatar_url)')
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

    // Insert message
    const { data: msg, error } = await supabase
      .from('messages')
      .insert({ sender_id: user.id, receiver_id: receiverId, content: content.trim() })
      .select('*, sender:users!messages_sender_id_fkey(id, full_name, role)')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    // Async PII check — fire and forget (don't block the response)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    fetch(`${siteUrl}/api/chat/flag`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messageId: msg.id,
        content: msg.content,
        senderId: user.id,
        senderName: msg.sender?.full_name,
      }),
    }).catch(() => {}) // don't await — don't block user

    return NextResponse.json({ message: msg })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
