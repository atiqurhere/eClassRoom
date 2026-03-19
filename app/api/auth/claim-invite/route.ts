import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Called after successful signup to claim the invite code so it can't be reused
export async function POST(request: NextRequest) {
  try {
    const { code, type, userId } = await request.json()

    if (!code || !type || !userId) {
      return NextResponse.json({ error: 'Missing fields.' }, { status: 400 })
    }

    const supabase = await createClient()
    const table    = type === 'student' ? 'student_invites' : 'teacher_invites'
    const codeCol  = type === 'student' ? 'student_code'    : 'teacher_code'

    const { error } = await supabase
      .from(table)
      .update({ user_id: userId, claimed_at: new Date().toISOString() })
      .eq(codeCol, code)
      .is('user_id', null) // only claim if not already claimed

    if (error) {
      console.error('Claim invite error:', error)
      // Non-fatal: user account was already created, log and continue
    }

    // v2: no students table. Set student_id on public.users and ensure user role is correct
    if (type === 'student') {
      await supabase
        .from('users')
        .update({ student_id: code, role: 'student' })
        .eq('id', userId)
    } else if (type === 'teacher') {
      await supabase
        .from('users')
        .update({ role: 'teacher' })
        .eq('id', userId)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Claim invite route error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
