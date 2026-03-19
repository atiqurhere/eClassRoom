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

  // v2: get student's enrolled courses → class IDs
  const { data: enrollments } = await supabase
    .from('course_enrollments')
    .select('course_id, courses(id, name, classes(id))')
    .eq('student_id', user.id)

  const classIds = (enrollments || [])
    .flatMap((e: any) => (e.courses?.classes || []).map((c: any) => c.id))
    .filter(Boolean)

  if (!enrollments || enrollments.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>My Assignments</h1>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 40, textAlign: 'center' }}>
          <p style={{ fontSize: '2rem', marginBottom: 8 }}>🎒</p>
          <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Not enrolled in any course yet</p>
          <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>Contact your admin to get enrolled.</p>
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
  const card    = 'var(--bg-card)'
  const bdr     = '1px solid var(--border)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>My Assignments</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: '0.875rem' }}>
          {assignments.length} total · {pending.length} pending · {overdue.length} overdue · {done.length} done
        </p>
      </div>

      {assignments.length === 0 ? (
        <div style={{ background: card, border: bdr, borderRadius: 14, padding: 40, textAlign: 'center' }}>
          <p style={{ fontSize: '2rem', marginBottom: 8 }}>📝</p>
          <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>No assignments yet</p>
          <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>Check back later.</p>
        </div>
      ) : (
        ['Overdue', 'Pending', 'Submitted'].map(section => {
          const list = section === 'Overdue' ? overdue : section === 'Pending' ? pending : done
          if (!list.length) return null
          const sectionColor = section === 'Overdue' ? '#ef4444' : section === 'Pending' ? '#4f8ef7' : '#22c55e'
          return (
            <div key={section} style={{ background: card, border: bdr, borderRadius: 14, padding: 20 }}>
              <p style={{ fontWeight: 700, color: sectionColor, marginBottom: 14 }}>
                {section === 'Overdue' ? '⚠️' : section === 'Pending' ? '⏳' : '✅'} {section} ({list.length})
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {list.map((a: any) => {
                  const sub = submMap.get(a.id)
                  return (
                    <div key={a.id} style={{ padding: '14px 16px', background: 'var(--bg-hover)', borderRadius: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{a.title}</p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 3 }}>
                            {(a.classes as any)?.class_name} · {(a.classes as any)?.courses?.name}
                          </p>
                          {a.description && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>{a.description}</p>}
                          <p style={{ fontSize: '0.75rem', marginTop: 6, color: section === 'Overdue' ? '#ef4444' : 'var(--text-muted)' }}>
                            Due {formatDistanceToNow(new Date(a.due_date), { addSuffix: true })} · Max {a.max_score} pts
                          </p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                          {sub ? (
                            <>
                              <span style={{ padding: '3px 10px', background: '#22c55e18', color: '#22c55e', borderRadius: 6, fontSize: '0.7rem', fontWeight: 700 }}>
                                {sub.status === 'graded' ? 'Graded' : 'Submitted'}
                              </span>
                              {sub.score != null && (
                                <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#22c55e' }}>{sub.score}/{a.max_score}</p>
                              )}
                            </>
                          ) : (
                            <Link href={`/student/submissions?assignmentId=${a.id}`}>
                              <button style={{ padding: '6px 14px', background: 'linear-gradient(135deg,#4f8ef7,#8b5cf6)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer' }}>
                                Submit
                              </button>
                            </Link>
                          )}
                          {a.file_url && (
                            <a href={a.file_url} target="_blank" rel="noopener noreferrer"
                              style={{ fontSize: '0.75rem', color: '#4f8ef7', textDecoration: 'underline' }}>
                              View File
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
