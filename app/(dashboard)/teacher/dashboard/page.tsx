export const dynamic   = 'force-dynamic'
export const revalidate = 0

import { createClient }        from '@/lib/supabase/server'
import { redirect }            from 'next/navigation'
import Link                    from 'next/link'
import { formatDistanceToNow } from 'date-fns'

export default async function TeacherDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  // Role already verified by (dashboard)/layout.tsx

  const { data: profile } = await supabase
    .from('users').select('full_name').eq('id', user.id!).single()

  const submissionIds = (await supabase.from('assignments').select('id').eq('teacher_id', user.id!)).data?.map((a: any) => a.id) || []

  const [coursesRes, liveRes, assignmentsRes, submissionsRes] = await Promise.all([
    supabase.from('courses').select('id, name, class_id, classes(class_name)').eq('teacher_id', user.id!),
    supabase.from('live_classes').select('id, title, status, room_id, start_time').eq('teacher_id', user.id!).order('start_time', { ascending: false }).limit(5),
    supabase.from('assignments').select('id, title, due_date, course_id').eq('teacher_id', user.id!).order('created_at', { ascending: false }).limit(6),
    submissionIds.length > 0
      ? supabase.from('submissions').select('id, status, submitted_at, grade, assignments(title)').in('assignment_id', submissionIds).order('submitted_at', { ascending: false }).limit(5)
      : Promise.resolve({ data: [] }),
  ])

  const now        = new Date()
  const courses    = (coursesRes.data    || []) as any[]
  const live       = (liveRes.data       || []) as any[]
  const assigns    = (assignmentsRes.data || []) as any[]
  const subs       = (submissionsRes.data || []) as any[]
  const upcomingDue = assigns.filter(a => new Date(a.due_date) > now).length
  const card  = 'var(--bg-card)'
  const bdr   = '1px solid var(--border)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>Teacher Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: '0.875rem' }}>
            Welcome back, {profile?.full_name?.split(' ')[0] ?? 'Teacher'} 👋
          </p>
        </div>
        <Link href="/teacher/live-class" style={{ padding: '8px 18px', background: 'linear-gradient(135deg,#4f8ef7,#8b5cf6)', color: '#fff', borderRadius: 10, fontWeight: 600, fontSize: '0.875rem', textDecoration: 'none' }}>
          ▶ Start Live Class
        </Link>
      </div>

      {/* Stats — emoji only, no JSX in arrays */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14 }}>
        {[
          { emoji: '📚', label: 'My Courses',   value: courses.length,   sub: 'Active courses',          fg: '#4f8ef7', bg: '#4f8ef718' },
          { emoji: '📡', label: 'Live Classes', value: live.filter((l: any) => l.status === 'live').length, sub: 'Currently active', fg: '#22c55e', bg: '#22c55e18' },
          { emoji: '📝', label: 'Assignments',  value: assigns.length,   sub: `${upcomingDue} upcoming`,  fg: '#f59e0b', bg: '#f59e0b18' },
          { emoji: '📬', label: 'Submissions',  value: subs.length,      sub: 'Awaiting review',          fg: '#8b5cf6', bg: '#8b5cf618' },
        ].map(s => (
          <div key={s.label} style={{ background: card, border: bdr, borderRadius: 14, padding: 18 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', marginBottom: 10 }}>{s.emoji}</div>
            <p style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--text-primary)' }}>{s.value}</p>
            <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: 2 }}>{s.label}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="dash-grid-main">

        {/* My Courses */}
        <div style={{ background: card, border: bdr, borderRadius: 14, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>📚 My Courses</p>
            <Link href="/teacher/classes" style={{ fontSize: '0.8125rem', color: '#4f8ef7', textDecoration: 'none' }}>View All →</Link>
          </div>
          {!courses.length ? (
            <p style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Your admin will assign courses to you.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {courses.slice(0, 5).map((c: any) => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg-hover)', borderRadius: 10 }}>
                  <div>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{(c.classes as any)?.class_name}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Link href={`/teacher/live-class?courseId=${c.id}`} style={{ padding: '5px 12px', background: '#22c55e', color: '#fff', borderRadius: 7, fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none' }}>Start</Link>
                    <Link href={`/teacher/classes/${c.id}`} style={{ padding: '5px 12px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', borderRadius: 7, fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none', border: bdr }}>View</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Recent Assignments */}
          <div style={{ background: card, border: bdr, borderRadius: 14, padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>📝 Recent Assignments</p>
              <Link href="/teacher/assignments" style={{ fontSize: '0.75rem', padding: '4px 10px', background: '#4f8ef718', color: '#4f8ef7', borderRadius: 6, textDecoration: 'none', fontWeight: 600 }}>+ New</Link>
            </div>
            {!assigns.length ? (
              <p style={{ textAlign: 'center', padding: '12px 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>No assignments yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {assigns.slice(0, 4).map((a: any) => {
                  const isOverdue = new Date(a.due_date) < now
                  return (
                    <div key={a.id} style={{ padding: '8px 12px', background: 'var(--bg-hover)', borderRadius: 8 }}>
                      <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>{a.title}</p>
                      <p style={{ fontSize: '0.75rem', color: isOverdue ? '#ef4444' : 'var(--text-muted)', marginTop: 3 }}>
                        Due {formatDistanceToNow(new Date(a.due_date), { addSuffix: true })}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Recent Submissions */}
          <div style={{ background: card, border: bdr, borderRadius: 14, padding: 18 }}>
            <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>📬 Recent Submissions</p>
            {!subs.length ? (
              <p style={{ textAlign: 'center', padding: '12px 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>No submissions yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {subs.slice(0, 4).map((s: any) => {
                  const color = s.status === 'graded' ? '#22c55e' : s.status === 'submitted' ? '#4f8ef7' : '#f59e0b'
                  return (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-hover)', borderRadius: 8 }}>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', fontWeight: 600 }}>{(s.assignments as any)?.title}</p>
                      <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 100, background: `${color}18`, color, fontWeight: 700, textTransform: 'capitalize' }}>{s.status}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
