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
    .from('users').select('full_name, student_id').eq('id', user.id).single()

  // v2: students are enrolled in courses, not in a students table
  const { data: enrollments } = await supabase
    .from('course_enrollments')
    .select('course_id, enrolled_at, courses(id, name, classes(id, class_name, section, teacher_id, users!classes_teacher_id_fkey(full_name)))')
    .eq('student_id', user.id)
    .order('enrolled_at', { ascending: false })

  const courses = (enrollments || []).map((e: any) => e.courses).filter(Boolean)
  const allClasses = courses.flatMap((c: any) => (c.classes || []).map((cls: any) => ({ ...cls, course_name: c.name })))

  const [liveRes, assignmentsRes, submissionsRes, notifRes] = await Promise.all([
    supabase.from('live_classes').select('id, title, status, room_id, class_id, classes(class_name, courses(name))').eq('status', 'live'),
    supabase.from('assignments')
      .select('id, title, due_date, max_score, class_id, classes(class_name)')
      .in('class_id', allClasses.map((c: any) => c.id))
      .order('due_date', { ascending: true })
      .limit(6),
    supabase.from('submissions').select('id, status, assignment_id').eq('student_id', user.id).limit(30),
    supabase.from('notifications')
      .select('id, title, type, is_read, created_at')
      .or(`user_id.eq.${user.id},target_role.eq.student`)
      .order('created_at', { ascending: false })
      .limit(4),
  ])

  const now          = new Date()
  const live         = (liveRes.data     || []) as any[]
  const assignments  = (assignmentsRes.data || []) as any[]
  const submissions  = (submissionsRes.data || []) as any[]
  const notifs       = ((notifRes as any).data || []) as any[]
  const overdueCount = assignments.filter((a: any) => new Date(a.due_date) < now).length
  const submittedIds = new Set(submissions.map((s: any) => s.assignment_id))

  // Only show live sessions relevant to student's enrolled classes
  const myClassIds     = new Set(allClasses.map((c: any) => c.id))
  const relevantLive   = live.filter((l: any) => myClassIds.has(l.class_id))

  const card   = 'var(--bg-card)'
  const border = '1px solid var(--border)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          Welcome back, {profile?.full_name?.split(' ')[0] ?? 'Student'} 👋
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: '0.875rem' }}>
          {profile?.student_id ? `ID: ${profile.student_id} · ` : ''}{courses.length} course{courses.length !== 1 ? 's' : ''} enrolled
        </p>
      </div>

      {/* Stats */}
      <div className="dash-stats-grid">
        {[
          { emoji: '📚', label: 'Enrolled Courses',  value: courses.length,    sub: `${allClasses.length} classes total`, fg: '#4f8ef7', bg: '#4f8ef718' },
          { emoji: '📡', label: 'Live Now',           value: relevantLive.length, sub: relevantLive.length > 0 ? 'In progress!' : 'None active', fg: '#22c55e', bg: '#22c55e18' },
          { emoji: '📝', label: 'Upcoming Tasks',    value: assignments.length, sub: `${overdueCount} overdue`,   fg: '#f59e0b', bg: '#f59e0b18' },
          { emoji: '📬', label: 'Submissions',       value: submissions.length, sub: 'All time',                fg: '#8b5cf6', bg: '#8b5cf618' },
        ].map(s => (
          <div key={s.label} style={{ background: card, border, borderRadius: 16, padding: 18 }}>
            <p style={{ fontSize: '1.5rem', marginBottom: 6 }}>{s.emoji}</p>
            <p style={{ fontSize: '2rem', fontWeight: 800, color: s.fg }}>{s.value}</p>
            <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: 2 }}>{s.label}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="dash-grid-main">
        {/* Left: My Courses */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: card, border, borderRadius: 16, padding: 20 }}>
            <p style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)', marginBottom: 14 }}>📖 My Enrolled Courses</p>
            {courses.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 24 }}>Not enrolled in any courses yet.</p>
            ) : courses.map((course: any) => (
              <div key={course.id} style={{ marginBottom: 14, padding: '12px 14px', background: 'var(--bg-hover)', borderRadius: 12 }}>
                <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9375rem' }}>📚 {course.name}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                  {(course.classes || []).map((cls: any) => (
                    <span key={cls.id} style={{ fontSize: '0.75rem', padding: '3px 10px', background: 'var(--bg-card)', border, borderRadius: 6, color: 'var(--text-secondary)' }}>
                      {cls.class_name}{cls.section ? ` (${cls.section})` : ''} {cls.users?.full_name ? `· ${cls.users.full_name}` : ''}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Live sessions */}
          {relevantLive.length > 0 && (
            <div style={{ background: card, border, borderRadius: 16, padding: 20 }}>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>📡 Live Sessions</p>
              {relevantLive.map((l: any) => (
                <Link key={l.id} href={`/student/live-class/${l.id}`}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.18)', borderRadius: 10, textDecoration: 'none', marginBottom: 8 }}>
                  <div>
                    <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{l.title}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{(l.classes as any)?.class_name}</p>
                  </div>
                  <span style={{ padding: '3px 10px', background: 'rgba(34,197,94,0.15)', color: '#22c55e', borderRadius: 100, fontSize: '0.7rem', fontWeight: 700 }}>JOIN</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right: Assignments + Notifications */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Assignments */}
          <div style={{ background: card, border, borderRadius: 16, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>📝 Upcoming Assignments</p>
              <Link href="/student/assignments" style={{ fontSize: '0.8125rem', color: '#4f8ef7', textDecoration: 'none' }}>View All →</Link>
            </div>
            {assignments.length === 0 ? (
              <p style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>No upcoming assignments</p>
            ) : assignments.map((a: any) => {
              const isOverdue   = new Date(a.due_date) < now
              const isSubmitted = submittedIds.has(a.id)
              return (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg-hover)', borderRadius: 10, marginBottom: 8 }}>
                  <div>
                    <p style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{a.title}</p>
                    <p style={{ fontSize: '0.75rem', color: isOverdue ? '#ef4444' : 'var(--text-muted)' }}>
                      {(a.classes as any)?.class_name} · Due {new Date(a.due_date).toLocaleDateString()}
                    </p>
                  </div>
                  <span style={{ fontSize: '0.7rem', padding: '3px 8px', borderRadius: 6, fontWeight: 700, background: isSubmitted ? '#22c55e18' : isOverdue ? '#ef444418' : '#4f8ef718', color: isSubmitted ? '#22c55e' : isOverdue ? '#ef4444' : '#4f8ef7' }}>
                    {isSubmitted ? '✓ Done' : isOverdue ? 'Overdue' : 'Pending'}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Notifications */}
          {notifs.length > 0 && (
            <div style={{ background: card, border, borderRadius: 16, padding: 20 }}>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>🔔 Notifications</p>
              {notifs.map((n: any) => (
                <div key={n.id} style={{ padding: '10px 12px', background: n.is_read ? 'var(--bg-hover)' : 'rgba(79,142,247,0.08)', borderRadius: 10, marginBottom: 8, borderLeft: n.is_read ? 'none' : '3px solid #4f8ef7' }}>
                  <p style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{n.title}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
