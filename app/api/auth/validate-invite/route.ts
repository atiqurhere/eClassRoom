import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { code, type } = await request.json()

    if (!code || !type || !['student', 'teacher'].includes(type)) {
      return NextResponse.json({ valid: false, message: 'Invalid request.' }, { status: 400 })
    }

    const supabase = await createClient()

    const fn = type === 'student' ? 'validate_student_code' : 'validate_teacher_code'
    const { data, error } = await supabase.rpc(fn, { p_code: code })

    if (error) {
      console.error('Invite validation error:', error)
      return NextResponse.json({ valid: false, message: 'Validation failed. Please try again.' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('Validate invite error:', err)
    return NextResponse.json({ valid: false, message: 'Internal server error.' }, { status: 500 })
  }
}
