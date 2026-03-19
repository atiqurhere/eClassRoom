export const dynamic   = 'force-dynamic'
export const revalidate = 0

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function TeacherReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get teacher's courses with class info
  const { data: courses } = await supabase
    .from('courses')
    .select('id, name, class_id, classes(class_name)')
    .eq('teacher_id', user.id)

  const courseIds = (courses || []).map((c: any) => c.id)

  // Attendance stats per course (just counts from live_classes → join)
  const { data: sessions } = courseIds.length
    ? await supabase
        .from('live_classes')
        .select('id, title, start_time, course_id, status')
        .in('course_id', courseIds)
        .order('start_time', { ascending: false })
        .limit(20)
    : { data: [] }

  // Assignment stats
  const { data: assignments } = courseIds.length
    ? await supabase
        .from('assignments')
        .select('id, title, course_id, due_date, max_score')
        .in('course_id', courseIds)
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

  const courseMap: Record<string, any> = {}
  ;(courses || []).forEach((c: any) => { courseMap[c.id] = c })

  const card = 'var(--bg-card)'
  const bdr  = '1px solid var(--border)'

  const totalSessions = (sessions || []).length
  const endedSessions = ((sessions || []) as any[]).filter((s: any) => s.status === 'ended').length
  const totalAssignments = (assignments || []).length
  const totalSubmissions = (submissions || []).length
  const gradedSubmissions = ((submissions || []) as any[]).filter((s: any) => s.score != null).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>📊 Reports</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: '0.875rem' }}>Class performance and assignment stats</p>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
        {[
          { label: 'Total Sessions', value: totalSessions, icon: '🎥', color: '#4f8ef7' },
          { label: 'Completed Sessions', value: endedSessions, icon: '✅', color: '#22c55e' },
          { label: 'Assignments Created', value: totalAssignments, icon: '📝', color: '#f59e0b' },
          { label: 'Submissions Received', value: totalSubmissions, icon: '📬', color: '#8b5cf6' },
          { label: 'Graded Submissions', value: gradedSubmissions, icon: '🏅', color: '#ef4444' },
        ].map(stat => (
          <div key={stat.label} style={{ background: card, border: bdr, borderRadius: 14, padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: '1.5rem' }}>{stat.icon}</span>
            </div>
            <p style={{ fontSize: '1.75rem', fontWeight: 800, color: stat.color }}>{stat.value}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="dash-grid-main">
        {/* Session History */}
        <div style={{ background: card, border: bdr, borderRadius: 14, padding: 20 }}>
          <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>🎥 Recent Sessions</p>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem', minWidth: 380 }}>
            <thead><tr style={{ borderBottom: bdr }}>{['Title', 'Course', 'Date', 'Status'].map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700 }}>{h}</th>
            ))}</tr></thead>
            <tbody>{(sessions || []).length === 0
              ? <tr><td colSpan={4} style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>No sessions yet</td></tr>
              : ((sessions || []) as any[]).map((s: any) => (
                <tr key={s.id} style={{ borderBottom: bdr }}>
                  <td style={{ padding: '8px', color: 'var(--text-primary)', fontWeight: 500 }}>{s.title}</td>
                  <td style={{ padding: '8px', color: 'var(--text-muted)' }}>{courseMap[s.course_id]?.name}</td>
                  <td style={{ padding: '8px', color: 'var(--text-muted)' }}>{s.start_time ? new Date(s.start_time).toLocaleDateString() : '—'}</td>
                  <td style={{ padding: '8px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 100, fontSize: '0.7rem', fontWeight: 700,
                      background: s.status === 'live' ? '#22c55e20' : '#4f8ef718',
                      color: s.status === 'live' ? '#22c55e' : '#4f8ef7' }}>
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))
            }</tbody>
          </table></div>
        </div>

        {/* Assignment Stats */}
        <div style={{ background: card, border: bdr, borderRadius: 14, padding: 20 }}>
          <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>📝 Assignment Performance</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {((assignments || []) as any[]).length === 0 && (
              <p style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>No assignments yet</p>
            )}
            {((assignments || []) as any[]).map((a: any) => {
              const subs = submissionsByAssignment[a.id] || []
              const graded = subs.filter((s: any) => s.score != null)
              const avgScore = graded.length > 0
                ? Math.round(graded.reduce((acc: number, s: any) => acc + (s.score || 0), 0) / graded.length)
                : null
              const pct = a.max_score && graded.length > 0 ? Math.round((avgScore! / a.max_score) * 100) : null
              return (
                <div key={a.id} style={{ padding: '12px 14px', background: 'var(--bg-hover)', borderRadius: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{a.title}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        {courseMap[a.course_id]?.name} · Due {a.due_date ? new Date(a.due_date).toLocaleDateString() : '—'}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                      <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>{subs.length} subs</p>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {avgScore != null ? `Avg: ${avgScore}/${a.max_score} (${pct}%)` : 'Not graded'}
                      </p>
                    </div>
                  </div>
                  {pct != null && (
                    <div style={{ marginTop: 8, background: 'var(--bg-secondary)', borderRadius: 100, height: 5 }}>
                      <div style={{ width: `${pct}%`, height: '100%', borderRadius: 100,
                        background: pct >= 70 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444' }} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
