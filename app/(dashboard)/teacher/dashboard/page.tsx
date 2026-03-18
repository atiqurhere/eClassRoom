export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Video, BookOpen, Users, ClipboardList, Plus, Play } from 'lucide-react'
import { StatCard } from '@/components/ui/Stat'
import { SectionCard } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

export default async function TeacherDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('role, full_name').eq('id', user.id).single()
  if (profile?.role !== 'teacher') redirect(`/${profile?.role}/dashboard`)

  // Fetch teacher data
  const [coursesRes, liveRes, assignmentsRes, submissionsRes] = await Promise.all([
    supabase.from('courses').select('id, name, class_id, classes(class_name)').eq('teacher_id', user.id),
    supabase.from('live_classes').select('id, title, status, room_id, start_time, courses(name)').eq('teacher_id', user.id).order('start_time', { ascending: false }).limit(5),
    supabase.from('assignments').select('id, title, due_date, course_id, courses(name)').eq('teacher_id', user.id).order('created_at', { ascending: false }).limit(6),
    supabase.from('submissions').select('id, status, submitted_at, grade, assignments(title)').in('assignment_id',
      (await supabase.from('assignments').select('id').eq('teacher_id', user.id)).data?.map((a: any) => a.id) || []
    ).order('submitted_at', { ascending: false }).limit(5),
  ])

  const now = new Date()
  const upcomingDue = assignmentsRes.data?.filter((a: any) => new Date(a.due_date) > now) || []

  return (
    <div className="space-y-6">
      <div className="page-header flex items-start justify-between">
        <div>
          <h1>Teacher Dashboard</h1>
          <p>Welcome back, {profile?.full_name?.split(' ')[0]} 👋</p>
        </div>
        <Link href="/teacher/live-class">
          <Button variant="gradient" leftIcon={<Play size={16} />}>Start Live Class</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="My Courses" value={coursesRes.data?.length || 0} subtitle="Active courses" icon={<BookOpen size={20} />} iconColor="var(--accent-blue)" gradient />
        <StatCard title="Live Classes" value={liveRes.data?.filter((l: any) => l.status === 'live').length || 0} subtitle="Currently active" icon={<Video size={20} />} iconColor="var(--accent-green)" />
        <StatCard title="Assignments" value={assignmentsRes.data?.length || 0} subtitle={`${upcomingDue.length} upcoming due`} icon={<ClipboardList size={20} />} iconColor="var(--accent-orange)" />
        <StatCard title="Submissions" value={submissionsRes.data?.length || 0} subtitle="Awaiting review" icon={<Users size={20} />} iconColor="var(--accent-purple)" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* My Courses */}
        <div className="xl:col-span-3">
          <SectionCard
            title="My Courses"
            subtitle="Classes you are teaching"
            icon={<BookOpen size={16} style={{ color: 'var(--accent-blue)' }} />}
            action={<Link href="/teacher/classes"><Button variant="ghost" size="sm">View All</Button></Link>}
          >
            {!coursesRes.data?.length ? (
              <div className="empty-state">
                <div className="empty-state-icon"><BookOpen size={28} /></div>
                <h3>No courses yet</h3>
                <p>Your admin will assign courses to you.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {coursesRes.data.slice(0, 5).map((course: any) => (
                  <Link key={course.id} href={`/teacher/classes/${course.id}`}
                    className="flex items-center justify-between p-3 rounded-lg transition-colors"
                    style={{ background: 'var(--bg-hover)' }}>
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{course.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {(course.classes as any)?.class_name}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/teacher/live-class?courseId=${course.id}`}>
                        <Button variant="success" size="sm" leftIcon={<Video size={12} />}>Start</Button>
                      </Link>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Right column */}
        <div className="xl:col-span-2 space-y-5">
          {/* Recent Assignments */}
          <SectionCard
            title="Recent Assignments"
            icon={<ClipboardList size={16} style={{ color: 'var(--accent-orange)' }} />}
            action={<Button variant="ghost" size="sm" leftIcon={<Plus size={14} />}>New</Button>}
          >
            {!assignmentsRes.data?.length ? (
              <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>No assignments yet</p>
            ) : (
              <div className="space-y-2">
                {assignmentsRes.data.slice(0, 4).map((a: any) => (
                  <div key={a.id} className="flex items-start justify-between p-3 rounded-lg"
                    style={{ background: 'var(--bg-hover)' }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{a.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        Due {formatDistanceToNow(new Date(a.due_date), { addSuffix: true })}
                      </p>
                    </div>
                    <StatusBadge status={new Date(a.due_date) < now ? 'late' : 'scheduled'} />
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Recent Submissions */}
          <SectionCard title="Recent Submissions" icon={<ClipboardList size={16} style={{ color: 'var(--accent-purple)' }} />}>
            {!submissionsRes.data?.length ? (
              <p className="text-sm text-center py-3" style={{ color: 'var(--text-muted)' }}>No submissions yet</p>
            ) : (
              <div className="space-y-2">
                {submissionsRes.data.slice(0, 4).map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between p-2.5 rounded-lg"
                    style={{ background: 'var(--bg-hover)' }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                        {(s.assignments as any)?.title}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {formatDistanceToNow(new Date(s.submitted_at), { addSuffix: true })}
                      </p>
                    </div>
                    <StatusBadge status={s.status} />
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
