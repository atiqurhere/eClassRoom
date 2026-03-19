export const dynamic   = 'force-dynamic'
export const revalidate = 0

import { createClient } from '@/lib/supabase/server'
import { redirect }     from 'next/navigation'
import { SectionCard }  from '@/components/ui/Card'
import { BookOpen, Video, FileText, Send, CheckCircle, BarChart2 } from 'lucide-react'

export default async function TeacherReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: classes } = await supabase
    .from('classes')
    .select('id, class_name, section, course_id, courses(name)')
    .eq('teacher_id', user.id)
    .order('class_name')

  const classIds = (classes || []).map((c: any) => c.id)

  const { data: sessions } = classIds.length
    ? await supabase
      .from('live_classes')
      .select('id, title, start_time, class_id, status')
      .in('class_id', classIds)
      .order('start_time', { ascending: false })
      .limit(30)
    : { data: [] }

  const { data: assignments } = classIds.length
    ? await supabase
      .from('assignments')
      .select('id, title, class_id, due_date, max_score')
      .in('class_id', classIds)
      .order('due_date', { ascending: false })
    : { data: [] }

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

  const totalSessions     = (sessions || []).length
  const completedSessions = (sessions || []).filter((s: any) => s.status === 'ended').length
  const totalAssignments  = (assignments || []).length
  const totalSubmissions  = Object.values(submissionsByAssignment).reduce((sum, arr) => sum + arr.length, 0)
  const gradedSubmissions = Object.values(submissionsByAssignment).flat().filter((s: any) => s.status === 'graded').length

  const topStats = [
    { label: 'My Classes',         value: classIds.length,      color: 'var(--accent-blue)',   bg: 'rgba(79,142,247,0.1)',   icon: <BookOpen size={16} /> },
    { label: 'Total Sessions',     value: totalSessions,        color: 'var(--accent-purple)', bg: 'rgba(139,92,246,0.1)',  icon: <Video size={16} /> },
    { label: 'Sessions Completed', value: completedSessions,    color: 'var(--accent-green)',  bg: 'rgba(34,197,94,0.1)',   icon: <CheckCircle size={16} /> },
    { label: 'Assignments',        value: totalAssignments,     color: 'var(--accent-orange)', bg: 'rgba(245,158,11,0.1)', icon: <FileText size={16} /> },
    { label: 'Submissions',        value: totalSubmissions,     color: 'var(--accent-purple)', bg: 'rgba(168,85,247,0.1)', icon: <Send size={16} /> },
    { label: 'Graded',             value: gradedSubmissions,    color: '#ec4899',              bg: 'rgba(236,72,153,0.1)', icon: <BarChart2 size={16} /> },
  ]

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1>My Reports</h1>
        <p>Class-level performance overview</p>
      </div>

      {/* Summary Stats */}
      <div className="dash-stats-grid">
        {topStats.map(s => (
          <div key={s.label} className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.icon}</div>
            <div>
              <p style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{s.value}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Per-Class Breakdown */}
      {(classes || []).length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14 }}>
          <BookOpen size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p style={{ color: 'var(--text-muted)' }}>No classes assigned to you yet.</p>
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
          <SectionCard
            key={cls.id}
            title={`${cls.class_name}${cls.section ? ` (${cls.section})` : ''} — ${(cls.courses as any)?.name}`}
            icon={<BookOpen size={15} style={{ color: 'var(--accent-blue)' }} />}
          >
            {/* Mini stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, padding: '10px 20px 16px' }}>
              {[
                { label: 'Sessions',    value: clsSessions.length },
                { label: 'Assignments', value: clsAssignments.length },
                { label: 'Submissions', value: clsSubs.length },
                { label: 'Avg Score',   value: avgScore != null ? `${avgScore}%` : '—' },
              ].map(stat => (
                <div key={stat.label} style={{ padding: '10px 14px', background: 'var(--bg-hover)', borderRadius: 10, textAlign: 'center' }}>
                  <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>{stat.value}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Recent sessions table */}
            {clsSessions.length > 0 && (
              <div>
                <div style={{ padding: '0 20px 10px' }}>
                  <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Recent Sessions</p>
                </div>
                <table className="data-table">
                  <thead><tr><th>Title</th><th style={{textAlign:'right'}}>Date</th><th style={{textAlign:'right'}}>Status</th></tr></thead>
                  <tbody>
                    {clsSessions.slice(0, 5).map((s: any) => (
                      <tr key={s.id}>
                        <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{s.title}</td>
                        <td style={{ textAlign: 'right', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{new Date(s.start_time).toLocaleDateString()}</td>
                        <td style={{ textAlign: 'right' }}>
                          <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 700, background: s.status === 'ended' ? 'rgba(34,197,94,0.1)' : 'rgba(79,142,247,0.1)', color: s.status === 'ended' ? 'var(--accent-green)' : 'var(--accent-blue)', textTransform: 'capitalize' }}>
                            {s.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        )
      })}
    </div>
  )
}
