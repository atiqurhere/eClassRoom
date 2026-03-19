export const dynamic   = 'force-dynamic'
export const revalidate = 0

import { createClient }        from '@/lib/supabase/server'
import { redirect }            from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import Link                    from 'next/link'
import { FileText, Clock, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import { SectionCard }         from '@/components/ui/Card'
import { Button }              from '@/components/ui/Button'

export default async function StudentAssignmentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: enrollments } = await supabase
    .from('course_enrollments')
    .select('course_id, courses(id, name, classes(id))')
    .eq('student_id', user.id)

  const classIds = (enrollments || [])
    .flatMap((e: any) => (e.courses?.classes || []).map((c: any) => c.id))
    .filter(Boolean)

  if (!enrollments || enrollments.length === 0) {
    return (
      <div className="space-y-6">
        <div className="page-header"><h1>My Assignments</h1></div>
        <div style={{ textAlign: 'center', padding: 48, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14 }}>
          <FileText size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Not enrolled in any course yet</p>
          <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: '0.875rem' }}>Contact your admin to get enrolled.</p>
        </div>
      </div>
    )
  }

  const [assignmentsRes, submissionsRes] = await Promise.all([
    classIds.length
      ? supabase.from('assignments')
          .select('id, title, description, due_date, max_score, file_url, class_id, teacher_id, created_at, classes(class_name, courses(name))')
          .in('class_id', classIds)
          .order('due_date', { ascending: true })
      : Promise.resolve({ data: [] }),
    supabase.from('submissions')
      .select('id, status, score, feedback, submitted_at, file_url, assignment_id')
      .eq('student_id', user.id),
  ])

  const assignments = (assignmentsRes.data || []) as any[]
  const submissions = (submissionsRes.data || []) as any[]
  const submMap     = new Map(submissions.map(s => [s.assignment_id, s]))

  const now     = new Date()
  const pending = assignments.filter(a => !submMap.has(a.id) && new Date(a.due_date) >= now)
  const overdue = assignments.filter(a => !submMap.has(a.id) && new Date(a.due_date) < now)
  const done    = assignments.filter(a => submMap.has(a.id))

  const topStats = [
    { label: 'Total',    value: assignments.length, color: 'var(--accent-blue)',   bg: 'rgba(79,142,247,0.1)',   icon: <FileText size={16} /> },
    { label: 'Pending',  value: pending.length,     color: 'var(--accent-blue)',   bg: 'rgba(79,142,247,0.1)',   icon: <Clock size={16} /> },
    { label: 'Overdue',  value: overdue.length,     color: 'var(--accent-red)',    bg: 'rgba(239,68,68,0.1)',   icon: <AlertTriangle size={16} /> },
    { label: 'Submitted',value: done.length,        color: 'var(--accent-green)',  bg: 'rgba(34,197,94,0.1)',   icon: <CheckCircle size={16} /> },
  ]

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1>My Assignments</h1>
        <p>{assignments.length} total · {pending.length} pending · {overdue.length} overdue · {done.length} submitted</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {topStats.map(s => (
          <div key={s.label} className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.icon}</div>
            <div>
              <p style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{s.value}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 3 }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {assignments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14 }}>
          <FileText size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>No assignments yet</p>
          <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: '0.875rem' }}>Check back later.</p>
        </div>
      ) : (
        <>
          {[
            { key: 'Overdue',   list: overdue, color: 'var(--accent-red)',   icon: <AlertTriangle size={14} /> },
            { key: 'Pending',   list: pending, color: 'var(--accent-blue)',  icon: <Clock size={14} /> },
            { key: 'Submitted', list: done,    color: 'var(--accent-green)', icon: <CheckCircle size={14} /> },
          ].map(({ key, list, color, icon }) => {
            if (!list.length) return null
            return (
              <SectionCard key={key} title={`${key} (${list.length})`} icon={<span style={{ color }}>{icon}</span>} scrollable>
                <table className="data-table">
                  <thead>
                    <tr><th>Assignment</th><th>Class</th><th>Due</th><th>Score</th><th style={{textAlign:'right'}}>Action</th></tr>
                  </thead>
                  <tbody>
                    {list.map((a: any) => {
                      const sub = submMap.get(a.id)
                      return (
                        <tr key={a.id}>
                          <td>
                            <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{a.title}</p>
                            {a.description && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{a.description}</p>}
                          </td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                            {(a.classes as any)?.class_name}
                            {(a.classes as any)?.courses?.name && <span style={{ display: 'block', fontSize: '0.75rem' }}>{(a.classes as any).courses.name}</span>}
                          </td>
                          <td style={{ fontSize: '0.8125rem', color: key === 'Overdue' ? 'var(--accent-red)' : 'var(--text-muted)', fontWeight: key === 'Overdue' ? 600 : 400 }}>
                            {formatDistanceToNow(new Date(a.due_date), { addSuffix: true })}
                          </td>
                          <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {sub?.score != null ? `${sub.score}/${a.max_score}` : `—/${a.max_score}`}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {sub ? (
                              <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700, background: sub.status === 'graded' ? 'rgba(34,197,94,0.12)' : 'rgba(79,142,247,0.12)', color: sub.status === 'graded' ? 'var(--accent-green)' : 'var(--accent-blue)' }}>
                                {sub.status === 'graded' ? 'Graded' : 'Submitted'}
                              </span>
                            ) : (
                              <Link href={`/student/submissions?assignmentId=${a.id}`}>
                                <Button variant="gradient" size="sm">Submit</Button>
                              </Link>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </SectionCard>
            )
          })}
        </>
      )}
    </div>
  )
}
