export const dynamic   = 'force-dynamic'
export const revalidate = 0

import { createClient }        from '@/lib/supabase/server'
import { redirect }            from 'next/navigation'
import Link                    from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { BookOpen, Video, ClipboardList, Bell, Clock, CheckCircle } from 'lucide-react'

export default async function StudentDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  // Role already verified by (dashboard)/layout.tsx

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
    classId ? supabase.from('assignments').select('id, title, due_date, max_score, courses(name)').order('due_date', { ascending: true }).limit(6) : Promise.resolve({ data: [] }),
    studentRecord ? supabase.from('submissions').select('id, status, grade, submitted_at, assignments(id, title, max_score)').eq('student_id', studentRecord.id).order('submitted_at', { ascending: false }).limit(5) : Promise.resolve({ data: [] }),
    supabase.from('notifications').select('id, title, message, type, is_read, created_at').or(`user_id.eq.${user.id},target_role.eq.student`).order('created_at', { ascending: false }).limit(4),
  ])

  const now          = new Date()
  const courses      = (coursesRes.data   || []) as any[]
  const live         = (liveRes.data      || []) as any[]
  const assignments  = (assignmentsRes.data || []) as any[]
  const submissions  = (submissionsRes.data || []) as any[]
  const notifs       = ((notifRes as any).data || []) as any[]
  const overdueCount = assignments.filter(a => new Date(a.due_date) < now).length
  const submittedIds = new Set(submissions.map(s => s.assignments?.id))

  const card = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }

  const stats = [
    { title: 'My Courses',   value: courses.length,    sub: 'Enrolled subjects',   icon: <BookOpen size={20} />,     color: '#4f8ef7' },
    { title: 'Live Classes', value: live.length,        sub: 'In session now',      icon: <Video size={20} />,        color: '#22c55e' },
    { title: 'Assignments',  value: assignments.length, sub: `${overdueCount} overdue`, icon: <ClipboardList size={20} />, color: '#f59e0b' },
    { title: 'Submissions',  value: submissions.length, sub: 'Completed work',      icon: <CheckCircle size={20} />,  color: '#8b5cf6' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
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

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
        {stats.map(s => (
          <div key={s.title} style={card}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${s.color}18`, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              {s.icon}
            </div>
            <p style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--text-primary)' }}>{s.value}</p>
            <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: 2 }}>{s.title}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{s.sub}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Live now */}
          {live.length > 0 && (
            <div style={card}>
              <p style={{ fontWeight: 600, color: '#22c55e', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Video size={16} /> 🔴 Live Classes — Join Now
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {live.map((cls: any) => (
                  <div key={cls.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 10 }}>
                    <div>
                      <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{cls.title}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{cls.courses?.name}</p>
                    </div>
                    <Link href={`/student/live-class/${cls.id}`} style={{ padding: '6px 14px', background: '#22c55e', color: '#fff', borderRadius: 8, fontSize: '0.8125rem', fontWeight: 600, textDecoration: 'none' }}>
                      Join
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Courses */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <BookOpen size={16} style={{ color: '#4f8ef7' }} /> My Courses
              </p>
              <Link href="/student/classes" style={{ fontSize: '0.8125rem', color: 'var(--accent-blue)', textDecoration: 'none' }}>View All →</Link>
            </div>
            {!courses.length ? (
              <p style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Your admin will assign you to a class.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {courses.slice(0, 6).map((course: any) => (
                  <Link key={course.id} href={`/student/classes/${course.id}`} style={{ padding: '12px 14px', background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: 10, textDecoration: 'none' }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(79,142,247,0.15)', color: '#4f8ef7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                      <BookOpen size={14} />
                    </div>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{course.name}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{(course.users as any)?.full_name || 'No teacher'}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Assignments */}
          <div style={card}>
            <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <ClipboardList size={16} style={{ color: '#f59e0b' }} /> Upcoming Assignments
            </p>
            {!assignments.length ? (
              <p style={{ textAlign: 'center', padding: '12px 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>No assignments</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {assignments.slice(0, 5).map((a: any) => {
                  const isOverdue = new Date(a.due_date) < now
                  const submitted = submittedIds.has(a.id)
                  return (
                    <div key={a.id} style={{ padding: '10px 12px', background: 'var(--bg-hover)', borderRadius: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                        <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>{a.title}</p>
                        <span style={{ padding: '2px 8px', borderRadius: 100, fontSize: '0.65rem', fontWeight: 700, background: submitted ? 'rgba(34,197,94,0.12)' : isOverdue ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)', color: submitted ? '#22c55e' : isOverdue ? '#ef4444' : '#f59e0b', flexShrink: 0 }}>
                          {submitted ? 'Submitted' : isOverdue ? 'Late' : 'Pending'}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: isOverdue ? '#ef4444' : 'var(--text-muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={10} /> {formatDistanceToNow(new Date(a.due_date), { addSuffix: true })}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Notifications */}
          <div style={card}>
            <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bell size={16} style={{ color: '#8b5cf6' }} /> Notifications
            </p>
            {!notifs.length ? (
              <p style={{ textAlign: 'center', padding: '12px 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>No notifications</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {notifs.map((n: any) => (
                  <div key={n.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 10px', background: n.is_read ? 'transparent' : 'rgba(79,142,247,0.08)', border: `1px solid ${n.is_read ? 'transparent' : 'rgba(79,142,247,0.2)'}`, borderRadius: 8 }}>
                    <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>
                      {n.type === 'class_start' ? '🎥' : n.type === 'assignment' ? '📝' : n.type === 'grade' ? '📊' : '📢'}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.title}</p>
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
