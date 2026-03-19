export const dynamic   = 'force-dynamic'
export const revalidate = 0

import { createClient }        from '@/lib/supabase/server'
import { redirect }            from 'next/navigation'
import Link                    from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { BookOpen, Video, FileText, Send, Bell, ChevronRight } from 'lucide-react'
import { SectionCard }         from '@/components/ui/Card'

export default async function StudentDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users').select('full_name, student_id').eq('id', user.id).single()

  const { data: enrollments } = await supabase
    .from('course_enrollments')
    .select('course_id, enrolled_at, courses(id, name, classes(id, class_name, section, teacher_id, users!classes_teacher_id_fkey(full_name)))')
    .eq('student_id', user.id)
    .order('enrolled_at', { ascending: false })

  const courses    = (enrollments || []).map((e: any) => e.courses).filter(Boolean)
  const allClasses = courses.flatMap((c: any) => (c.classes || []).map((cls: any) => ({ ...cls, course_name: c.name })))

  const myClassIds = new Set(allClasses.map((c: any) => c.id))

  const [liveRes, assignmentsRes, submissionsRes, notifRes] = await Promise.all([
    supabase.from('live_classes').select('id, title, status, room_id, class_id, classes(class_name, courses(name))').eq('status', 'live'),
    allClasses.length
      ? supabase.from('assignments').select('id, title, due_date, max_score, class_id, classes(class_name)').in('class_id', allClasses.map((c: any) => c.id)).order('due_date', { ascending: true }).limit(6)
      : Promise.resolve({ data: [] }),
    supabase.from('submissions').select('id, status, assignment_id').eq('student_id', user.id).limit(30),
    supabase.from('notifications').select('id, title, type, is_read, created_at').or(`user_id.eq.${user.id},target_role.eq.student`).order('created_at', { ascending: false }).limit(4),
  ])

  const now          = new Date()
  const live         = (liveRes.data     || []) as any[]
  const assignments  = (assignmentsRes.data || []) as any[]
  const submissions  = (submissionsRes.data || []) as any[]
  const notifs       = ((notifRes as any).data || []) as any[]
  const overdueCount = assignments.filter((a: any) => new Date(a.due_date) < now).length
  const submittedIds = new Set(submissions.map((s: any) => s.assignment_id))
  const relevantLive = live.filter((l: any) => myClassIds.has(l.class_id))

  const stats = [
    { label: 'Enrolled Courses', value: courses.length,       sub: `${allClasses.length} classes`, color: 'var(--accent-blue)',   bg: 'rgba(79,142,247,0.1)',  icon: <BookOpen size={16} /> },
    { label: 'Live Now',         value: relevantLive.length,  sub: relevantLive.length > 0 ? 'In progress!' : 'None active', color: 'var(--accent-green)',  bg: 'rgba(34,197,94,0.1)',  icon: <Video size={16} /> },
    { label: 'Upcoming Tasks',   value: assignments.length,   sub: `${overdueCount} overdue`,      color: 'var(--accent-orange)', bg: 'rgba(245,158,11,0.1)', icon: <FileText size={16} /> },
    { label: 'Submissions',      value: submissions.length,   sub: 'All time',                     color: 'var(--accent-purple)', bg: 'rgba(139,92,246,0.1)',icon: <Send size={16} /> },
  ]

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1>Welcome back, {profile?.full_name?.split(' ')[0] ?? 'Student'} 👋</h1>
        <p>{profile?.student_id ? `ID: ${profile.student_id} · ` : ''}{courses.length} course{courses.length !== 1 ? 's' : ''} enrolled</p>
      </div>

      {/* Stats */}
      <div className="dash-stats-grid">
        {stats.map(s => (
          <div key={s.label} className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.icon}</div>
            <div>
              <p style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{s.value}</p>
              <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: 3 }}>{s.label}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 1 }}>{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="dash-grid-main">
        {/* Left: Courses + Live */}
        <div className="space-y-5">
          <SectionCard
            title="My Enrolled Courses"
            icon={<BookOpen size={15} style={{ color: 'var(--accent-blue)' }} />}
            action={<Link href="/student/classes" style={{ fontSize: '0.8125rem', color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 500 }}>View All →</Link>}
          >
            {courses.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Not enrolled in any courses yet.</p>
            ) : (
              <table className="data-table">
                <thead><tr><th>Course</th><th>Classes</th></tr></thead>
                <tbody>
                  {courses.map((c: any) => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                        {(c.classes || []).map((cls: any) => cls.class_name + (cls.section ? ` (${cls.section})` : '')).join(', ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </SectionCard>

          {relevantLive.length > 0 && (
            <SectionCard title="Live Sessions" icon={<Video size={15} style={{ color: 'var(--accent-green)' }} />}>
              <table className="data-table">
                <thead><tr><th>Session</th><th>Class</th><th style={{textAlign:'right'}}>Action</th></tr></thead>
                <tbody>
                  {relevantLive.map((l: any) => (
                    <tr key={l.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{l.title}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>{(l.classes as any)?.class_name}</td>
                      <td style={{ textAlign: 'right' }}>
                        <Link href={`/student/live-class/${l.id}`} style={{ display: 'inline-block', padding: '5px 12px', background: 'rgba(34,197,94,0.12)', color: 'var(--accent-green)', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700, textDecoration: 'none' }}>JOIN</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </SectionCard>
          )}
        </div>

        {/* Right: Assignments + Notifications */}
        <div className="space-y-5">
          <SectionCard
            title="Upcoming Assignments"
            icon={<FileText size={15} style={{ color: 'var(--accent-orange)' }} />}
            action={<Link href="/student/assignments" style={{ fontSize: '0.8125rem', color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 500 }}>View All →</Link>}
          >
            {assignments.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>No upcoming assignments.</p>
            ) : (
              <table className="data-table">
                <thead><tr><th>Title</th><th>Class</th><th style={{textAlign:'right'}}>Status</th></tr></thead>
                <tbody>
                  {assignments.map((a: any) => {
                    const isOverdue   = new Date(a.due_date) < now
                    const isSubmitted = submittedIds.has(a.id)
                    return (
                      <tr key={a.id}>
                        <td>
                          <p style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{a.title}</p>
                          <p style={{ fontSize: '0.75rem', color: isOverdue ? 'var(--accent-red)' : 'var(--text-muted)', marginTop: 2 }}>Due {new Date(a.due_date).toLocaleDateString()}</p>
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>{(a.classes as any)?.class_name}</td>
                        <td style={{ textAlign: 'right' }}>
                          <span style={{ padding: '4px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 700, background: isSubmitted ? 'rgba(34,197,94,0.12)' : isOverdue ? 'rgba(239,68,68,0.12)' : 'rgba(79,142,247,0.12)', color: isSubmitted ? 'var(--accent-green)' : isOverdue ? 'var(--accent-red)' : 'var(--accent-blue)' }}>
                            {isSubmitted ? '✓ Done' : isOverdue ? 'Overdue' : 'Pending'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </SectionCard>

          {notifs.length > 0 && (
            <SectionCard title="Notifications" icon={<Bell size={15} style={{ color: 'var(--accent-blue)' }} />}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {notifs.map((n: any) => (
                  <div key={n.id} style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', background: n.is_read ? 'transparent' : 'rgba(79,142,247,0.04)', borderLeft: n.is_read ? 'none' : '3px solid var(--accent-blue)' }}>
                    <p style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{n.title}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 3 }}>{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</p>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  )
}
