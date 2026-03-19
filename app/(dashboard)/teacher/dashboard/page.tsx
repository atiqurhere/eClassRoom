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

  const { data: profile } = await supabase
    .from('users').select('full_name').eq('id', user.id!).single()

  // v2: teacher is on classes, not courses
  const { data: myClasses } = await supabase
    .from('classes')
    .select('id, class_name, section, course_id, courses(name)')
    .eq('teacher_id', user.id!)

  const classIds = (myClasses || []).map((c: any) => c.id)

  // Recent assignments for teacher's classes
  const { data: assignsRaw } = classIds.length
    ? await supabase.from('assignments')
        .select('id, title, due_date, class_id')
        .in('class_id', classIds)
        .eq('teacher_id', user.id!)
        .order('created_at', { ascending: false })
        .limit(6)
    : { data: [] }

  const assigns = (assignsRaw || []) as any[]
  const assignmentIds = assigns.map((a: any) => a.id)

  // Recent submissions for teacher's assignments
  const { data: subsRaw } = assignmentIds.length
    ? await supabase.from('submissions')
        .select('id, status, submitted_at, score, assignment_id, assignments(title)')
        .in('assignment_id', assignmentIds)
        .order('submitted_at', { ascending: false })
        .limit(5)
    : { data: [] }

  // Recent live sessions for teacher's classes
  const { data: liveRaw } = classIds.length
    ? await supabase.from('live_classes')
        .select('id, title, status, room_id, start_time, class_id')
        .eq('teacher_id', user.id!)
        .in('class_id', classIds)
        .order('start_time', { ascending: false })
        .limit(5)
    : { data: [] }

  const now     = new Date()
  const live    = (liveRaw || []) as any[]
  const subs    = (subsRaw || []) as any[]
  const upcomingDue = assigns.filter((a: any) => new Date(a.due_date) > now).length
  const card    = 'var(--bg-card)'
  const bdr     = '1px solid var(--border)'

  const classMap: Record<string, any> = {}
  ;(myClasses || []).forEach((c: any) => { classMap[c.id] = c })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="page-header">
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

      {/* Stats */}
      <div className="dash-stats-grid">
        {[
          { emoji: '📚', label: 'My Classes',   value: (myClasses || []).length, sub: 'Assigned classes',           fg: '#4f8ef7', bg: '#4f8ef718' },
          { emoji: '📡', label: 'Live Classes', value: live.filter((l: any) => l.status === 'live').length, sub: 'Currently active', fg: '#22c55e', bg: '#22c55e18' },
          { emoji: '📝', label: 'Assignments',  value: assigns.length,            sub: `${upcomingDue} upcoming`,    fg: '#f59e0b', bg: '#f59e0b18' },
          { emoji: '📬', label: 'Submissions',  value: subs.length,               sub: 'Recent (5)',                 fg: '#8b5cf6', bg: '#8b5cf618' },
        ].map(s => (
          <div key={s.label} style={{ background: card, border: bdr, borderRadius: 14, padding: 18 }}>
            <p style={{ fontSize: '1.5rem', marginBottom: 6 }}>{s.emoji}</p>
            <p style={{ fontSize: '2rem', fontWeight: 800, color: s.fg }}>{s.value}</p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: 2 }}>{s.label}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="dash-grid-main">
        {/* My Classes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: card, border: bdr, borderRadius: 16, padding: 20 }}>
            <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 14 }}>📖 My Assigned Classes</p>
            {(myClasses || []).length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 24 }}>No classes assigned yet.</p>
            ) : (myClasses || []).map((cls: any) => (
              <div key={cls.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-hover)', borderRadius: 10, marginBottom: 8 }}>
                <div>
                  <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{cls.class_name}{cls.section ? ` (${cls.section})` : ''}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{(cls.courses as any)?.name}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Recent live sessions */}
          <div style={{ background: card, border: bdr, borderRadius: 16, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>📡 Recent Sessions</p>
              <Link href="/teacher/live-class" style={{ fontSize: '0.8125rem', color: '#4f8ef7', textDecoration: 'none' }}>Start →</Link>
            </div>
            {live.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: 16 }}>No sessions yet.</p>
            ) : live.map((l: any) => (
              <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 12px', background: 'var(--bg-hover)', borderRadius: 10, marginBottom: 8 }}>
                <div>
                  <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{l.title}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{classMap[l.class_id]?.class_name}</p>
                </div>
                <span style={{ fontSize: '0.7rem', padding: '3px 8px', borderRadius: 6, fontWeight: 700, background: l.status === 'live' ? '#22c55e18' : 'var(--bg-card)', color: l.status === 'live' ? '#22c55e' : 'var(--text-muted)' }}>
                  {l.status === 'live' ? 'LIVE' : l.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Assignments + Submissions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: card, border: bdr, borderRadius: 16, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>📝 Recent Assignments</p>
              <Link href="/teacher/assignments" style={{ fontSize: '0.8125rem', color: '#4f8ef7', textDecoration: 'none' }}>View All →</Link>
            </div>
            {assigns.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: 16 }}>No assignments yet.</p>
            ) : assigns.map((a: any) => {
              const isOverdue = new Date(a.due_date) < now
              return (
                <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 12px', background: 'var(--bg-hover)', borderRadius: 10, marginBottom: 8 }}>
                  <div>
                    <p style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{a.title}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{classMap[a.class_id]?.class_name}</p>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: isOverdue ? '#ef4444' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {isOverdue ? '⚠️ Overdue' : `Due ${new Date(a.due_date).toLocaleDateString()}`}
                  </span>
                </div>
              )
            })}
          </div>

          <div style={{ background: card, border: bdr, borderRadius: 16, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>📬 Recent Submissions</p>
              <Link href="/teacher/assignments" style={{ fontSize: '0.8125rem', color: '#4f8ef7', textDecoration: 'none' }}>Grade →</Link>
            </div>
            {subs.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: 16 }}>No submissions yet.</p>
            ) : subs.map((s: any) => (
              <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 12px', background: 'var(--bg-hover)', borderRadius: 10, marginBottom: 8 }}>
                <p style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                  {(s.assignments as any)?.title}
                </p>
                <span style={{ fontSize: '0.7rem', padding: '3px 8px', borderRadius: 6, fontWeight: 700, background: s.status === 'graded' ? '#22c55e18' : '#f59e0b18', color: s.status === 'graded' ? '#22c55e' : '#f59e0b', textTransform: 'capitalize' }}>
                  {s.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
