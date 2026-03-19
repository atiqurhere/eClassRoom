export const dynamic   = 'force-dynamic'
export const revalidate = 0

import { createClient } from '@/lib/supabase/server'
import { redirect }     from 'next/navigation'

export default async function TeacherReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get teacher's assigned classes (v2: teacher is on classes, not courses)
  const { data: classes } = await supabase
    .from('classes')
    .select('id, class_name, section, course_id, courses(name)')
    .eq('teacher_id', user.id)
    .order('class_name')

  const classIds = (classes || []).map((c: any) => c.id)

  // Sessions per class
  const { data: sessions } = classIds.length
    ? await supabase
      .from('live_classes')
      .select('id, title, start_time, class_id, status')
      .in('class_id', classIds)
      .order('start_time', { ascending: false })
      .limit(30)
    : { data: [] }

  // Assignments per class (v2: class_id FK)
  const { data: assignments } = classIds.length
    ? await supabase
      .from('assignments')
      .select('id, title, class_id, due_date, max_score')
      .in('class_id', classIds)
      .order('due_date', { ascending: false })
    : { data: [] }

  // Submission counts per assignment
  const assignmentIds = ((assignments || []) as any[]).map((a: any) => a.id)
  const { data: submissions } = assignmentIds.length
    ? await supabase
      .from('submissions')
      .select('id, assignment_id, score, status')
      .in('assignment_id', assignmentIds)
    : { data: [] }

  const submissionsByAssignment: Record<string, any[]> = {}
  ;(submissions || []).forEach((s: any) => {
    if (!submissionsByAssignment[s.assignment_id]) submissionsByAssignment[s.assignment_id] = []
    submissionsByAssignment[s.assignment_id].push(s)
  })

  const classMap: Record<string, any> = {}
  ;(classes || []).forEach((c: any) => { classMap[c.id] = c })

  const card = 'var(--bg-card)'
  const bdr  = '1px solid var(--border)'

  const totalSessions     = (sessions || []).length
  const completedSessions = (sessions || []).filter((s: any) => s.status === 'ended').length
  const totalAssignments  = (assignments || []).length

  const totalSubmissions  = Object.values(submissionsByAssignment).reduce((sum, arr) => sum + arr.length, 0)
  const gradedSubmissions = Object.values(submissionsByAssignment)
    .flat().filter((s: any) => s.status === 'graded').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>📊 My Reports</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: '0.875rem' }}>Class-level performance overview</p>
      </div>

      {/* Summary Stats */}
      <div className="dash-stats-grid">
        {[
          { label: 'My Classes',         value: classIds.length,      emoji: '📚', fg: '#4f8ef7', bg: '#4f8ef718' },
          { label: 'Total Sessions',     value: totalSessions,        emoji: '📡', fg: '#8b5cf6', bg: '#8b5cf618' },
          { label: 'Sessions Completed', value: completedSessions,    emoji: '✅', fg: '#22c55e', bg: '#22c55e18' },
          { label: 'Assignments',        value: totalAssignments,     emoji: '📝', fg: '#f59e0b', bg: '#f59e0b18' },
          { label: 'Submissions',        value: totalSubmissions,     emoji: '📬', fg: '#a855f7', bg: '#a855f718' },
          { label: 'Graded',            value: gradedSubmissions,    emoji: '🏆', fg: '#ec4899', bg: '#ec489918' },
        ].map(s => (
          <div key={s.label} style={{ background: card, border: bdr, borderRadius: 14, padding: '16px 18px' }}>
            <p style={{ fontSize: '1.5rem', marginBottom: 6 }}>{s.emoji}</p>
            <p style={{ fontSize: '1.75rem', fontWeight: 800, color: s.fg }}>{s.value}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Per-Class Breakdown */}
      {(classes || []).length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, background: card, border: bdr, borderRadius: 14 }}>
          <p style={{ fontSize: '2rem' }}>📋</p>
          <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>No classes assigned to you yet.</p>
        </div>
      ) : (classes || []).map((cls: any) => {
        const clsSessions    = (sessions || []).filter((s: any) => s.class_id === cls.id)
        const clsAssignments = (assignments || []).filter((a: any) => a.class_id === cls.id)
        const clsSubs        = clsAssignments.flatMap((a: any) => submissionsByAssignment[a.id] || [])
        const clsGraded      = clsSubs.filter((s: any) => s.status === 'graded')
        const avgScore       = clsGraded.length > 0
          ? Math.round(clsGraded.reduce((sum: number, s: any) => {
              const asgn = clsAssignments.find((a: any) => a.id === s.assignment_id)
              return sum + (s.score / (asgn?.max_score || 100)) * 100
            }, 0) / clsGraded.length)
          : null

        return (
          <div key={cls.id} style={{ background: card, border: bdr, borderRadius: 14, padding: 20 }}>
            <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: 14 }}>
              📖 {cls.class_name}{cls.section ? ` (${cls.section})` : ''} — {(cls.courses as any)?.name}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px,1fr))', gap: 10 }}>
              {[
                { label: 'Sessions',      value: clsSessions.length },
                { label: 'Assignments',   value: clsAssignments.length },
                { label: 'Submissions',   value: clsSubs.length },
                { label: 'Avg Score',     value: avgScore != null ? `${avgScore}%` : '—' },
              ].map(stat => (
                <div key={stat.label} style={{ padding: '10px 14px', background: 'var(--bg-hover)', borderRadius: 10, textAlign: 'center' }}>
                  <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>{stat.value}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Recent sessions */}
            {clsSessions.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Recent Sessions</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {clsSessions.slice(0, 5).map((s: any) => (
                    <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 12px', background: 'var(--bg-hover)', borderRadius: 8, fontSize: '0.8125rem' }}>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{s.title}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{new Date(s.start_time).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
