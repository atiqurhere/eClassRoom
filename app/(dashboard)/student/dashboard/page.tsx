export const dynamic   = 'force-dynamic'
export const revalidate = 0

import { createClient }        from '@/lib/supabase/server'
import { redirect }            from 'next/navigation'
import Link                    from 'next/link'
import { formatDistanceToNow } from 'date-fns'

export default async function StudentDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users').select('full_name').eq('id', user.id!).single()

  const { data: studentRecord } = await supabase
    .from('students')
    .select('id, student_id, class_id, classes(class_name)')
    .eq('user_id', user.id!)
    .single()

  const classId = studentRecord?.class_id

  const [coursesRes, liveRes, assignmentsRes, submissionsRes, notifRes] = await Promise.all([
    classId ? supabase.from('courses').select('id, name, teacher_id, users(full_name)').eq('class_id', classId) : Promise.resolve({ data: [] }),
    classId ? supabase.from('live_classes').select('id, title, status, room_id, courses(name)').eq('status', 'live') : Promise.resolve({ data: [] }),
    classId ? supabase.from('assignments').select('id, title, due_date, max_score').order('due_date', { ascending: true }).limit(6) : Promise.resolve({ data: [] }),
    studentRecord ? supabase.from('submissions').select('id, status, assignments(id, title)').eq('student_id', studentRecord.id).limit(20) : Promise.resolve({ data: [] }),
    supabase.from('notifications').select('id, title, type, is_read, created_at').or(`user_id.eq.${user.id},target_role.eq.student`).order('created_at', { ascending: false }).limit(4),
  ])

  const now         = new Date()
  const courses     = (coursesRes.data    || []) as any[]
  const live        = (liveRes.data       || []) as any[]
  const assignments = (assignmentsRes.data || []) as any[]
  const submissions = (submissionsRes.data || []) as any[]
  const notifs      = ((notifRes as any).data || []) as any[]
  const overdueCount = assignments.filter((a: any) => new Date(a.due_date) < now).length
  const submittedIds = new Set(submissions.map((s: any) => s.assignments?.id))
  const card = 'var(--bg-card)'
  const border = '1px solid var(--border)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          Welcome back, {profile?.full_name?.split(' ')[0] ?? 'Student'} 👋
        </h1>
        {studentRecord && (
          <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: '0.875rem' }}>
            {(studentRecord as any).student_id} · {(studentRecord.classes as any)?.class_name || 'No class assigned'}
          </p>
        )}
      </div>

      {/* Stats — emoji only, no JSX in arrays */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14 }}>
        {[
          { emoji: '📚', label: 'My Courses',   value: courses.length,     sub: 'Enrolled subjects',        fg: '#4f8ef7', bg: '#4f8ef718' },
          { emoji: '📡', label: 'Live Classes', value: live.length,         sub: 'In session now',           fg: '#22c55e', bg: '#22c55e18' },
          { emoji: '📝', label: 'Assignments',  value: assignments.length,  sub: `${overdueCount} overdue`,  fg: '#f59e0b', bg: '#f59e0b18' },
          { emoji: '✅', label: 'Submissions',  value: submissions.length,  sub: 'Completed work',           fg: '#8b5cf6', bg: '#8b5cf618' },
        ].map(s => (
          <div key={s.label} style={{ background: card, border, borderRadius: 14, padding: 18 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', marginBottom: 10 }}>{s.emoji}</div>
            <p style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--text-primary)' }}>{s.value}</p>
            <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: 2 }}>{s.label}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{s.sub}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 290px', gap: 20, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Live now */}
          {live.length > 0 && (
            <div style={{ background: card, border, borderRadius: 14, padding: 18 }}>
              <p style={{ fontWeight: 600, color: '#22c55e', marginBottom: 12 }}>🔴 Live Classes — Join Now</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {live.map((cls: any) => (
                  <div key={cls.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.18)', borderRadius: 10 }}>
                    <div>
                      <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{cls.title}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{cls.courses?.name}</p>
                    </div>
                    <Link href={`/student/live-class/${cls.id}`} style={{ padding: '6px 14px', background: '#22c55e', color: '#fff', borderRadius: 8, fontSize: '0.8125rem', fontWeight: 600, textDecoration: 'none' }}>Join</Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Courses */}
          <div style={{ background: card, border, borderRadius: 14, padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>📚 My Courses</p>
              <Link href="/student/classes" style={{ fontSize: '0.8125rem', color: '#4f8ef7', textDecoration: 'none' }}>View All →</Link>
            </div>
            {!courses.length ? (
              <p style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Your admin will assign you to a class.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {courses.slice(0, 6).map((c: any) => (
                  <Link key={c.id} href={`/student/classes/${c.id}`} style={{ padding: '12px', background: 'var(--bg-hover)', border, borderRadius: 10, textDecoration: 'none' }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>{(c.users as any)?.full_name || 'No teacher'}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: card, border, borderRadius: 14, padding: 18 }}>
            <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>📝 Upcoming Assignments</p>
            {!assignments.length ? (
              <p style={{ textAlign: 'center', padding: '12px 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>No assignments</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {assignments.slice(0, 5).map((a: any) => {
                  const isOverdue = new Date(a.due_date) < now
                  const submitted = submittedIds.has(a.id)
                  const badgeColor = submitted ? '#22c55e' : isOverdue ? '#ef4444' : '#f59e0b'
                  const badgeBg   = submitted ? 'rgba(34,197,94,0.12)' : isOverdue ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)'
                  return (
                    <div key={a.id} style={{ padding: '10px 12px', background: 'var(--bg-hover)', borderRadius: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                        <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>{a.title}</p>
                        <span style={{ padding: '2px 8px', borderRadius: 100, fontSize: '0.65rem', fontWeight: 700, background: badgeBg, color: badgeColor, flexShrink: 0 }}>
                          {submitted ? 'Done' : isOverdue ? 'Late' : 'Due'}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: isOverdue ? '#ef4444' : 'var(--text-muted)', marginTop: 4 }}>
                        {formatDistanceToNow(new Date(a.due_date), { addSuffix: true })}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div style={{ background: card, border, borderRadius: 14, padding: 18 }}>
            <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>🔔 Notifications</p>
            {!notifs.length ? (
              <p style={{ textAlign: 'center', padding: '12px 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>No notifications</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {notifs.map((n: any) => (
                  <div key={n.id} style={{ display: 'flex', gap: 10, padding: '8px 10px', background: n.is_read ? 'transparent' : 'rgba(79,142,247,0.07)', border: `1px solid ${n.is_read ? 'transparent' : 'rgba(79,142,247,0.18)'}`, borderRadius: 8 }}>
                    <span style={{ fontSize: '1rem', flexShrink: 0 }}>
                      {n.type === 'class_start' ? '🎥' : n.type === 'assignment' ? '📝' : n.type === 'grade' ? '📊' : '📢'}
                    </span>
                    <div>
                      <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>{n.title}</p>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
