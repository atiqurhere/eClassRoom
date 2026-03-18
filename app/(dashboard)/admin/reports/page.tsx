import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BarChart2, Users, BookOpen, ClipboardList, CheckCircle, TrendingUp } from 'lucide-react'
import { StatCard } from '@/components/ui/Stat'
import { SectionCard } from '@/components/ui/Card'
import { RoleBadge, StatusBadge } from '@/components/ui/Badge'
import { AvatarWithName } from '@/components/ui/Avatar'

export const dynamic = 'force-dynamic'

export default async function AdminReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect(`/${profile?.role}/dashboard`)

  const [usersRes, classesRes, liveRes, assignRes, subRes, attendRes] = await Promise.all([
    supabase.from('users').select('id, role, full_name, email, created_at').order('created_at', { ascending: false }),
    supabase.from('classes').select('id, class_name'),
    supabase.from('live_classes').select('id, status, start_time, end_time'),
    supabase.from('assignments').select('id, title, due_date, teacher_id, users!assignments_teacher_id_fkey(full_name)').order('created_at', { ascending: false }).limit(10),
    supabase.from('submissions').select('id, status, grade, max_score:assignments(max_score)').eq('status', 'graded'),
    supabase.from('attendance').select('id, status'),
  ])

  const users = usersRes.data || []
  const live = liveRes.data || []
  const subs = subRes.data || []
  const attend = attendRes.data || []

  const endedClasses = live.filter(l => l.status === 'ended')
  const avgDuration = endedClasses.length
    ? Math.round(endedClasses.reduce((sum, l) => {
        if (!l.start_time || !l.end_time) return sum
        return sum + (new Date(l.end_time).getTime() - new Date(l.start_time).getTime()) / 60000
      }, 0) / endedClasses.length)
    : 0

  const gradedSubs = subs.filter((s: any) => s.grade != null)
  const avgGrade = gradedSubs.length
    ? Math.round(gradedSubs.reduce((sum: number, s: any) => sum + (s.grade / (s.max_score?.max_score || 100)) * 100, 0) / gradedSubs.length)
    : 0

  const attendRate = attend.length
    ? Math.round((attend.filter(a => a.status === 'present').length / attend.length) * 100)
    : 0

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1>Analytics &amp; Reports</h1>
        <p>Institutional performance overview</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={users.length} icon={<Users size={20} />} iconColor="var(--accent-blue)" gradient />
        <StatCard title="Classes Held" value={endedClasses.length} subtitle="Completed sessions" icon={<BookOpen size={20} />} iconColor="var(--accent-purple)" />
        <StatCard title="Avg. Grade" value={`${avgGrade}%`} subtitle="Across graded work" icon={<TrendingUp size={20} />} iconColor="var(--accent-green)" />
        <StatCard title="Attendance Rate" value={`${attendRate}%`} subtitle="Present / total" icon={<CheckCircle size={20} />} iconColor="var(--accent-orange)" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* User breakdown */}
        <SectionCard title="User Overview" icon={<Users size={16} style={{ color: 'var(--accent-blue)' }} />}>
          <table className="data-table">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th></tr></thead>
            <tbody>
              {users.slice(0, 8).map(u => (
                <tr key={u.id}>
                  <td><AvatarWithName name={u.full_name} size="xs" /></td>
                  <td className="text-xs" style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                  <td><RoleBadge role={u.role} /></td>
                  <td className="text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>

        {/* Recent assignments */}
        <SectionCard title="Recent Assignments" icon={<ClipboardList size={16} style={{ color: 'var(--accent-orange)' }} />}>
          <table className="data-table">
            <thead><tr><th>Title</th><th>Teacher</th><th>Due</th></tr></thead>
            <tbody>
              {!assignRes.data?.length ? (
                <tr><td colSpan={3} className="text-center py-6" style={{ color: 'var(--text-muted)' }}>No assignments</td></tr>
              ) : (
                assignRes.data.map((a: any) => (
                  <tr key={a.id}>
                    <td className="font-medium" style={{ color: 'var(--text-primary)' }}>{a.title}</td>
                    <td><AvatarWithName name={(a.users as any)?.full_name} size="xs" /></td>
                    <td className="text-xs">
                      {new Date(a.due_date) < new Date()
                        ? <span style={{ color: 'var(--accent-red)' }}>Overdue</span>
                        : new Date(a.due_date).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </SectionCard>

        {/* Submission stats */}
        <SectionCard title="Submission Summary" icon={<BarChart2 size={16} style={{ color: 'var(--accent-purple)' }} />}>
          <div className="space-y-4 py-2">
            {[
              { label: 'Graded', value: subs.filter(s => s.status === 'graded').length, color: 'var(--accent-green)' },
              { label: 'Submitted', value: subs.filter(s => s.status === 'submitted').length, color: 'var(--accent-blue)' },
              { label: 'Late', value: subs.filter(s => s.status === 'late').length, color: 'var(--accent-red)' },
            ].map(r => (
              <div key={r.label}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span style={{ color: 'var(--text-secondary)' }}>{r.label}</span>
                  <span style={{ color: r.color, fontWeight: 600 }}>{r.value}</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: subs.length > 0 ? `${(r.value / subs.length) * 100}%` : '0%', background: r.color }} />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Attendance */}
        <SectionCard title="Attendance Breakdown" icon={<CheckCircle size={16} style={{ color: 'var(--accent-green)' }} />}>
          <div className="space-y-4 py-2">
            {[
              { label: 'Present', value: attend.filter(a => a.status === 'present').length, color: 'var(--accent-green)' },
              { label: 'Absent', value: attend.filter(a => a.status === 'absent').length, color: 'var(--accent-red)' },
              { label: 'Late', value: attend.filter(a => a.status === 'late').length, color: 'var(--accent-orange)' },
            ].map(r => (
              <div key={r.label}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span style={{ color: 'var(--text-secondary)' }}>{r.label}</span>
                  <span style={{ color: r.color, fontWeight: 600 }}>{r.value}</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: attend.length > 0 ? `${(r.value / attend.length) * 100}%` : '0%', background: r.color }} />
                </div>
              </div>
            ))}
            <p className="text-center text-sm font-semibold mt-2" style={{ color: 'var(--accent-green)' }}>
              Overall Rate: {attendRate}%
            </p>
          </div>
        </SectionCard>
      </div>
    </div>
  )
}
