export const dynamic   = 'force-dynamic'
export const revalidate = 0

import { createClient }        from '@/lib/supabase/server'
import { redirect }            from 'next/navigation'
import Link                    from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { BookOpen, Video, FileText, Send, Play, ChevronRight } from 'lucide-react'
import { SectionCard }         from '@/components/ui/Card'

export default async function TeacherDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users').select('full_name').eq('id', user.id!).single()

  const { data: myClasses } = await supabase
    .from('classes')
    .select('id, class_name, section, course_id, courses(name)')
    .eq('teacher_id', user.id!)

  const classIds = (myClasses || []).map((c: any) => c.id)

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

  const { data: subsRaw } = assignmentIds.length
    ? await supabase.from('submissions')
        .select('id, status, submitted_at, score, assignment_id, assignments(title)')
        .in('assignment_id', assignmentIds)
        .order('submitted_at', { ascending: false })
        .limit(5)
    : { data: [] }

  const { data: liveRaw } = classIds.length
    ? await supabase.from('live_classes')
        .select('id, title, status, room_id, start_time, class_id')
        .eq('teacher_id', user.id!)
        .in('class_id', classIds)
        .order('start_time', { ascending: false })
        .limit(5)
    : { data: [] }

  const now          = new Date()
  const live         = (liveRaw || []) as any[]
  const subs         = (subsRaw || []) as any[]
  const upcomingDue  = assigns.filter((a: any) => new Date(a.due_date) > now).length
  const liveCount    = live.filter((l: any) => l.status === 'live').length

  const classMap: Record<string, any> = {}
  ;(myClasses || []).forEach((c: any) => { classMap[c.id] = c })

  const stats = [
    { label: 'My Classes',   value: (myClasses || []).length, sub: 'Assigned',         color: 'var(--accent-blue)',   bg: 'rgba(79,142,247,0.1)',  icon: <BookOpen size={16} /> },
    { label: 'Live Now',     value: liveCount,                sub: 'Active sessions',   color: 'var(--accent-green)',  bg: 'rgba(34,197,94,0.1)',   icon: <Video size={16} /> },
    { label: 'Assignments',  value: assigns.length,           sub: `${upcomingDue} upcoming`, color: 'var(--accent-orange)', bg: 'rgba(245,158,11,0.1)', icon: <FileText size={16} /> },
    { label: 'Submissions',  value: subs.length,              sub: 'Recent (5)',        color: 'var(--accent-purple)', bg: 'rgba(139,92,246,0.1)', icon: <Send size={16} /> },
  ]

  return (
    <div className="space-y-6">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1>Teacher Dashboard</h1>
          <p>Welcome back, {profile?.full_name?.split(' ')[0] ?? 'Teacher'} 👋</p>
        </div>
        <Link href="/teacher/live-class" style={{ padding: '9px 18px', background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))', color: '#fff', borderRadius: 10, fontWeight: 600, fontSize: '0.875rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
          <Play size={14} fill="white" /> Start Live Class
        </Link>
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
        {/* Left: Classes + Live */}
        <div className="space-y-5">
          <SectionCard
            title="My Assigned Classes"
            icon={<BookOpen size={15} style={{ color: 'var(--accent-blue)' }} />}
            action={<Link href="/teacher/classes" style={{ fontSize: '0.8125rem', color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 500 }}>View All →</Link>}
          >
            {(myClasses || []).length === 0 ? (
              <p style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>No classes assigned yet.</p>
            ) : (
              <table className="data-table">
                <thead><tr><th>Class</th><th>Course</th></tr></thead>
                <tbody>
                  {(myClasses || []).map((cls: any) => (
                    <tr key={cls.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {cls.class_name}{cls.section ? ` (${cls.section})` : ''}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>{(cls.courses as any)?.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </SectionCard>

          <SectionCard
            title="Recent Live Sessions"
            icon={<Video size={15} style={{ color: 'var(--accent-green)' }} />}
            action={<Link href="/teacher/live-class" style={{ fontSize: '0.8125rem', color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 500 }}>Start →</Link>}
          >
            {live.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>No sessions yet.</p>
            ) : (
              <table className="data-table">
                <thead><tr><th>Title</th><th>Class</th><th style={{textAlign:'right'}}>Status</th></tr></thead>
                <tbody>
                  {live.map((l: any) => (
                    <tr key={l.id}>
                      <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{l.title}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>{classMap[l.class_id]?.class_name}</td>
                      <td style={{ textAlign: 'right' }}>
                        <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 700, background: l.status === 'live' ? 'rgba(34,197,94,0.12)' : 'var(--bg-hover)', color: l.status === 'live' ? 'var(--accent-green)' : 'var(--text-muted)' }}>
                          {l.status === 'live' ? '🔴 LIVE' : l.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </SectionCard>
        </div>

        {/* Right: Assignments + Submissions */}
        <div className="space-y-5">
          <SectionCard
            title="Recent Assignments"
            icon={<FileText size={15} style={{ color: 'var(--accent-orange)' }} />}
            action={<Link href="/teacher/assignments" style={{ fontSize: '0.8125rem', color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 500 }}>View All →</Link>}
          >
            {assigns.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>No assignments yet.</p>
            ) : (
              <table className="data-table">
                <thead><tr><th>Title</th><th>Class</th><th style={{textAlign:'right'}}>Due</th></tr></thead>
                <tbody>
                  {assigns.map((a: any) => {
                    const isOverdue = new Date(a.due_date) < now
                    return (
                      <tr key={a.id}>
                        <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{a.title}</td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>{classMap[a.class_id]?.class_name}</td>
                        <td style={{ textAlign: 'right', fontSize: '0.75rem', color: isOverdue ? 'var(--accent-red)' : 'var(--text-muted)', fontWeight: isOverdue ? 600 : 400 }}>
                          {isOverdue ? '⚠ Overdue' : new Date(a.due_date).toLocaleDateString()}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </SectionCard>

          <SectionCard
            title="Recent Submissions"
            icon={<Send size={15} style={{ color: 'var(--accent-purple)' }} />}
            action={<Link href="/teacher/assignments" style={{ fontSize: '0.8125rem', color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 500 }}>Grade →</Link>}
          >
            {subs.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>No submissions yet.</p>
            ) : (
              <table className="data-table">
                <thead><tr><th>Assignment</th><th style={{textAlign:'right'}}>Status</th></tr></thead>
                <tbody>
                  {subs.map((s: any) => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{(s.assignments as any)?.title}</td>
                      <td style={{ textAlign: 'right' }}>
                        <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 700, background: s.status === 'graded' ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)', color: s.status === 'graded' ? 'var(--accent-green)' : 'var(--accent-orange)', textTransform: 'capitalize' }}>
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  )
}
