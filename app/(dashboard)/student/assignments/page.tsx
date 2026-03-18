export const dynamic   = 'force-dynamic'
export const revalidate = 0

import { createClient }        from '@/lib/supabase/server'
import { redirect }            from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import Link                    from 'next/link'
import { StudentSubmitForm }   from './StudentSubmitForm'

export default async function StudentAssignmentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: studentRecord } = await supabase
    .from('students').select('id, student_id, class_id').eq('user_id', user.id!).single()

  if (!studentRecord) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>My Assignments</h1>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 40, textAlign: 'center' }}>
          <p style={{ fontSize: '2rem', marginBottom: 8 }}>🎒</p>
          <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Not enrolled in a class yet</p>
          <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>Contact your admin to get enrolled.</p>
        </div>
      </div>
    )
  }

  const classId = studentRecord.class_id

  const [assignmentsRes, submissionsRes] = await Promise.all([
    classId
      ? supabase.from('assignments')
          .select('id, title, description, due_date, max_score, file_url, course_id, teacher_id, created_at, courses(name, class_id)')
          .eq('courses.class_id', classId)
          .order('due_date', { ascending: true })
      : Promise.resolve({ data: [] }),
    supabase.from('submissions')
      .select('id, status, grade, feedback, submitted_at, file_url, assignment_id')
      .eq('student_id', studentRecord.id),
  ])

  const assignments = (assignmentsRes.data || []) as any[]
  const submissions = (submissionsRes.data || []) as any[]
  const submMap     = new Map(submissions.map(s => [s.assignment_id, s]))

  const now     = new Date()
  const pending = assignments.filter(a => !submMap.has(a.id) && new Date(a.due_date) >= now)
  const overdue = assignments.filter(a => !submMap.has(a.id) && new Date(a.due_date) < now)
  const done    = assignments.filter(a => submMap.has(a.id))
  const card    = 'var(--bg-card)'
  const bdr     = '1px solid var(--border)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>My Assignments</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: '0.875rem' }}>
          {pending.length} pending · {overdue.length} overdue · {done.length} submitted
        </p>
      </div>

      {/* Pending */}
      {pending.length > 0 && (
        <div style={{ background: card, border: bdr, borderRadius: 14, padding: 20 }}>
          <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>📌 Pending</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {pending.map(a => (
              <AssignmentCard key={a.id} assignment={a} subMap={submMap} studentId={studentRecord.id} />
            ))}
          </div>
        </div>
      )}

      {/* Overdue */}
      {overdue.length > 0 && (
        <div style={{ background: card, border: '1px solid rgba(239,68,68,0.3)', borderRadius: 14, padding: 20 }}>
          <p style={{ fontWeight: 700, color: '#ef4444', marginBottom: 14 }}>⚠️ Overdue</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {overdue.map(a => (
              <AssignmentCard key={a.id} assignment={a} subMap={submMap} studentId={studentRecord.id} isOverdue />
            ))}
          </div>
        </div>
      )}

      {/* Submitted / Graded */}
      {done.length > 0 && (
        <div style={{ background: card, border: bdr, borderRadius: 14, padding: 20 }}>
          <p style={{ fontWeight: 700, color: '#22c55e', marginBottom: 14 }}>✅ Submitted</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {done.map(a => {
              const sub = submMap.get(a.id)
              return (
                <div key={a.id} style={{ padding: '12px 16px', background: 'var(--bg-hover)', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{a.title}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 3 }}>
                      {(a.courses as any)?.name} · Submitted {sub.submitted_at ? formatDistanceToNow(new Date(sub.submitted_at), { addSuffix: true }) : 'N/A'}
                    </p>
                    {sub.feedback && <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: 6, fontStyle: 'italic' }}>"{sub.feedback}"</p>}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 16 }}>
                    {sub.status === 'graded' && sub.grade != null ? (
                      <p style={{ fontWeight: 800, fontSize: '1.25rem', color: '#22c55e' }}>{sub.grade}<span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/{a.max_score}</span></p>
                    ) : (
                      <span style={{ fontSize: '0.75rem', padding: '3px 10px', background: '#4f8ef718', color: '#4f8ef7', borderRadius: 100, fontWeight: 700 }}>Pending Review</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {assignments.length === 0 && (
        <div style={{ background: card, border: bdr, borderRadius: 14, padding: 48, textAlign: 'center' }}>
          <p style={{ fontSize: '2rem', marginBottom: 8 }}>📚</p>
          <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>No assignments yet</p>
          <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>Your teachers haven&apos;t posted any assignments yet.</p>
        </div>
      )}
    </div>
  )
}

function AssignmentCard({ assignment: a, subMap, studentId, isOverdue }: { assignment: any; subMap: Map<string, any>; studentId: string; isOverdue?: boolean }) {
  const bdr       = '1px solid var(--border)'
  const sub       = subMap.get(a.id)
  const dueBadge  = isOverdue ? '#ef4444' : '#f59e0b'
  return (
    <div style={{ padding: '14px 16px', background: 'var(--bg-hover)', borderRadius: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9375rem' }}>{a.title}</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 3 }}>
            {(a.courses as any)?.name} · Max: {a.max_score} pts
          </p>
          {a.description && <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: 4 }}>{a.description}</p>}
        </div>
        <span style={{ padding: '3px 10px', borderRadius: 100, fontSize: '0.7rem', fontWeight: 700, background: `${dueBadge}18`, color: dueBadge, whiteSpace: 'nowrap', marginLeft: 12 }}>
          {isOverdue ? '⚠️ Overdue' : `Due ${formatDistanceToNow(new Date(a.due_date), { addSuffix: true })}`}
        </span>
      </div>
      {a.file_url && (
        <a href={a.file_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8125rem', color: '#4f8ef7', display: 'inline-block', marginBottom: 8 }}>📎 Download attachment</a>
      )}
      <StudentSubmitForm assignmentId={a.id} studentId={studentId} alreadySubmitted={!!sub} />
    </div>
  )
}
