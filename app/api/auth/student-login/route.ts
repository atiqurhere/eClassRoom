import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { studentId, password } = await request.json()

    if (!studentId || !password) {
      return NextResponse.json({ error: 'Student ID and password are required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Look up email by student_id
    const { data: student, error: lookupError } = await supabase
      .from('students')
      .select('user_id, users(email)')
      .eq('student_id', studentId)
      .single()

    if (lookupError || !student) {
      return NextResponse.json({ error: 'Invalid Student ID or password' }, { status: 401 })
    }

    const email = (student.users as any)?.email
    if (!email) {
      return NextResponse.json({ error: 'Account not found' }, { status: 401 })
    }

    // Sign in with the email
    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      return NextResponse.json({ error: 'Invalid Student ID or password' }, { status: 401 })
    }

    return NextResponse.json({ user: authData.user, session: authData.session })
  } catch (error) {
    console.error('Student login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
