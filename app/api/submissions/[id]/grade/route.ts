import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('users').select('role').eq('id', user.id).single()
    if (!['admin', 'teacher'].includes(profile?.role || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { score, feedback } = await request.json()
    if (score === undefined) {
      return NextResponse.json({ error: 'score is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('submissions')
      .update({ score, feedback, graded_at: new Date().toISOString(), graded_by: user.id })
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    // Notify student
    if (data?.student_id) {
      await supabase.from('notifications').insert({
        user_id: data.student_id,
        title: 'Assignment Graded',
        message: `Your submission has been graded. Score: ${score}${feedback ? `. Feedback: ${feedback}` : ''}`,
        type: 'grade',
        sender_id: user.id,
      })
    }

    return NextResponse.json({ submission: data })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
