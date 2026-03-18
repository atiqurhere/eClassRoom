export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BookOpen, Video, ClipboardList, Bell, Clock, CheckCircle } from 'lucide-react'
import { StatCard } from '@/components/ui/Stat'
import { SectionCard } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

export default async function StudentDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('role, full_name').eq('id', user.id).single()
  if (profile?.role !== 'student') redirect(`/${profile?.role}/dashboard`)

  // Get student record
  const { data: studentRecord } = await supabase
    .from('students')
    .select('id, student_id, class_id, classes(class_name)')
    .eq('user_id', user.id)
    .single()

  const classId = studentRecord?.class_id

  // Fetch student data
  const [coursesRes, liveRes, assignmentsRes, submissionsRes, notifRes] = await Promise.all([
    classId
      ? supabase.from('courses').select('id, name, teacher_id, users(full_name)').eq('class_id', classId)
      : Promise.resolve({ data: [] }),
    classId
      ? supabase.from('live_classes').select('id, title, status, room_id, courses(name, class_id)').eq('status', 'live')
      : Promise.resolve({ data: [] }),
    classId
      ? supabase.from('assignments').select('id, title, due_date, max_score, courses(name, class_id)').eq('courses.class_id', classId).order('due_date', { ascending: true }).limit(6)
      : Promise.resolve({ data: [] }),
    studentRecord
      ? supabase.from('submissions').select('id, status, grade, submitted_at, assignments(title, max_score)').eq('student_id', studentRecord.id).order('submitted_at', { ascending: false }).limit(5)
      : Promise.resolve({ data: [] }),
    supabase.from('notifications').select('id, title, message, type, is_read, created_at').or(`user_id.eq.${user.id},target_role.eq.student`).order('created_at', { ascending: false }).limit(4),
  ])

  const now = new Date()
  const overdueCount = assignmentsRes.data?.filter((a: any) => new Date(a.due_date) < now).length || 0
  const submittedIds = new Set(submissionsRes.data?.map((s: any) => (s.assignments as any)?.id))

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1>My Dashboard</h1>
        <p>
          Welcome back, {profile?.full_name?.split(' ')[0]} 👋
          {studentRecord && (
            <span className="ml-2 text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}>
              {studentRecord.student_id} · {(studentRecord.classes as any)?.class_name || 'No class assigned'}
            </span>
          )}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="My Courses" value={coursesRes.data?.length || 0} subtitle="Enrolled subjects" icon={<BookOpen size={20} />} iconColor="var(--accent-blue)" gradient />
        <StatCard title="Live Classes" value={liveRes.data?.length || 0} subtitle="In session now" icon={<Video size={20} />} iconColor="var(--accent-green)" />
        <StatCard title="Assignments" value={assignmentsRes.data?.length || 0} subtitle={`${overdueCount} overdue`} icon={<ClipboardList size={20} />} iconColor="var(--accent-orange)" />
        <StatCard title="Submissions" value={submissionsRes.data?.length || 0} subtitle="Completed work" icon={<CheckCircle size={20} />} iconColor="var(--accent-purple)" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Left: Live classes + courses */}
        <div className="xl:col-span-3 space-y-5">
          {/* Live Classes */}
          {(liveRes.data?.length || 0) > 0 && (
            <SectionCard
              title="🔴 Live Classes — Join Now"
              subtitle="Active sessions you can join"
              icon={<Video size={16} style={{ color: 'var(--accent-green)' }} />}
            >
              <div className="space-y-2">
                {liveRes.data?.map((cls: any) => (
                  <div key={cls.id} className="flex items-center justify-between p-3 rounded-lg"
                    style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{cls.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{cls.courses?.name}</p>
                    </div>
                    <Link href={`/student/live-class/${cls.id}`}>
                      <Button variant="gradient" size="sm" leftIcon={<Video size={12} />}>Join</Button>
                    </Link>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* My Courses */}
          <SectionCard
            title="My Courses"
            subtitle="Subjects you are enrolled in"
            icon={<BookOpen size={16} style={{ color: 'var(--accent-blue)' }} />}
            action={<Link href="/student/classes"><Button variant="ghost" size="sm">View All</Button></Link>}
          >
            {!coursesRes.data?.length ? (
              <div className="empty-state">
                <div className="empty-state-icon"><BookOpen size={28} /></div>
                <h3>Not enrolled yet</h3>
                <p>Your admin will assign you to a class.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {coursesRes.data.slice(0, 6).map((course: any) => (
                  <Link key={course.id} href={`/student/classes/${course.id}`}
                    className="p-3 rounded-lg transition-all cursor-pointer"
                    style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
                      style={{ background: 'rgba(79,142,247,0.15)', color: 'var(--accent-blue)' }}>
                      <BookOpen size={16} />
                    </div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{course.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {(course.users as any)?.full_name || 'No teacher assigned'}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Right: Assignments + Notifications */}
        <div className="xl:col-span-2 space-y-5">
          {/* Upcoming Assignments */}
          <SectionCard
            title="Upcoming Assignments"
            icon={<ClipboardList size={16} style={{ color: 'var(--accent-orange)' }} />}
          >
            {!assignmentsRes.data?.length ? (
              <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>No assignments</p>
            ) : (
              <div className="space-y-2">
                {assignmentsRes.data.slice(0, 5).map((a: any) => {
                  const isOverdue = new Date(a.due_date) < now
                  const submitted = submittedIds.has(a.id)
                  return (
                    <div key={a.id} className="p-3 rounded-lg" style={{ background: 'var(--bg-hover)' }}>
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{a.title}</p>
                        <StatusBadge status={submitted ? 'submitted' : isOverdue ? 'late' : 'scheduled'} />
                      </div>
                      <p className="text-xs mt-1 flex items-center gap-1" style={{ color: isOverdue ? 'var(--accent-red)' : 'var(--text-muted)' }}>
                        <Clock size={10} />
                        {formatDistanceToNow(new Date(a.due_date), { addSuffix: true })}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </SectionCard>

          {/* Notifications */}
          <SectionCard
            title="Recent Notifications"
            icon={<Bell size={16} style={{ color: 'var(--accent-purple)' }} />}
          >
            {!notifRes.data?.length ? (
              <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>No notifications</p>
            ) : (
              <div className="space-y-2">
                {notifRes.data.map((n: any) => (
                  <div key={n.id} className="flex items-start gap-3 p-2.5 rounded-lg"
                    style={{ background: n.is_read ? 'transparent' : 'rgba(79,142,247,0.08)', border: `1px solid ${n.is_read ? 'transparent' : 'rgba(79,142,247,0.2)'}` }}>
                    <span className="text-base mt-0.5 flex-shrink-0">
                      {n.type === 'class_start' ? '🎥' : n.type === 'assignment' ? '📝' : n.type === 'grade' ? '📊' : '📢'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{n.title}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  )
}
