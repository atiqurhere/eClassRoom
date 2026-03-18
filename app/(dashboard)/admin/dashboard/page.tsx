export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  Users, BookOpen, Video, TrendingUp,
  UserPlus, Activity, Eye, BarChart2
} from 'lucide-react'
import { StatCard } from '@/components/ui/Stat'
import { SectionCard } from '@/components/ui/Card'
import { RoleBadge, StatusBadge } from '@/components/ui/Badge'
import { AvatarWithName } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

async function getAdminStats(supabase: any) {
  const [usersRes, classesRes, liveRes, assignRes] = await Promise.all([
    supabase.from('users').select('id, role, created_at', { count: 'exact' }),
    supabase.from('classes').select('id', { count: 'exact' }),
    supabase.from('live_classes').select('id, title, status, start_time, courses(name)', { count: 'exact' }).eq('status', 'live'),
    supabase.from('assignments').select('id', { count: 'exact' }),
  ])
  return {
    totalUsers: usersRes.count || 0,
    recentUsers: usersRes.data?.slice(0, 5) || [],
    totalClasses: classesRes.count || 0,
    liveClasses: liveRes.data || [],
    totalAssignments: assignRes.count || 0,
    users: usersRes.data || [],
  }
}

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect(`/${profile?.role}/dashboard`)

  const stats = await getAdminStats(supabase)

  const roleCount = (role: string) => stats.users.filter((u: any) => u.role === role).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>Overview of your institution&apos;s learning activity</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          subtitle={`${roleCount('student')} students, ${roleCount('teacher')} teachers`}
          icon={<Users size={20} />}
          iconColor="var(--accent-blue)"
          gradient
        />
        <StatCard
          title="Active Classes"
          value={stats.totalClasses}
          subtitle="Across all sections"
          icon={<BookOpen size={20} />}
          iconColor="var(--accent-purple)"
        />
        <StatCard
          title="Live Right Now"
          value={stats.liveClasses.length}
          subtitle={stats.liveClasses.length > 0 ? 'Classes in session' : 'No active sessions'}
          icon={<Video size={20} />}
          iconColor="var(--accent-green)"
        />
        <StatCard
          title="Assignments"
          value={stats.totalAssignments}
          subtitle="Created by teachers"
          icon={<TrendingUp size={20} />}
          iconColor="var(--accent-orange)"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Live Classes Monitor */}
        <div className="xl:col-span-2">
          <SectionCard
            title="Live Classes"
            subtitle="Currently active sessions"
            icon={<Video size={16} style={{ color: 'var(--accent-green)' }} />}
            action={
              <Link href="/admin/monitoring">
                <Button variant="ghost" size="sm" leftIcon={<Eye size={14} />}>View All</Button>
              </Link>
            }
          >
            {stats.liveClasses.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon"><Video size={28} /></div>
                <h3>No live classes</h3>
                <p>No classes are currently in session.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.liveClasses.map((cls: any) => (
                  <div key={cls.id} className="flex items-center justify-between p-3 rounded-lg"
                    style={{ background: 'var(--bg-hover)' }}>
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{cls.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {cls.courses?.name} • Started {cls.start_time ? new Date(cls.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'recently'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status="live" />
                      <Link href="/admin/monitoring">
                        <Button variant="ghost" size="sm">Monitor</Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <SectionCard title="Quick Actions" icon={<Activity size={16} style={{ color: 'var(--accent-blue)' }} />}>
            <div className="space-y-2">
              {[
                { label: 'Add New User', href: '/admin/users', icon: <UserPlus size={16} />, color: 'var(--accent-blue)' },
                { label: 'Create Class', href: '/admin/classes', icon: <BookOpen size={16} />, color: 'var(--accent-purple)' },
                { label: 'View Reports', href: '/admin/reports', icon: <BarChart2 size={16} />, color: 'var(--accent-orange)' },
                { label: 'Monitor Classes', href: '/admin/monitoring', icon: <Eye size={16} />, color: 'var(--accent-green)' },
              ].map((action) => (
                <Link key={action.href} href={action.href}
                  className="flex items-center gap-3 p-3 rounded-lg transition-all cursor-pointer"
                  style={{ background: 'var(--bg-hover)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--border-light)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: `${action.color}20`, color: action.color }}>
                    {action.icon}
                  </div>
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{action.label}</span>
                </Link>
              ))}
            </div>
          </SectionCard>

          {/* Role Distribution */}
          <SectionCard title="User Distribution" icon={<Users size={16} style={{ color: 'var(--accent-purple)' }} />}>
            <div className="space-y-3">
              {[
                { label: 'Students', count: roleCount('student'), color: 'var(--accent-green)', total: stats.totalUsers },
                { label: 'Teachers', count: roleCount('teacher'), color: 'var(--accent-blue)', total: stats.totalUsers },
                { label: 'Admins', count: roleCount('admin'), color: 'var(--accent-red)', total: stats.totalUsers },
              ].map((r) => (
                <div key={r.label}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span style={{ color: 'var(--text-secondary)' }}>{r.label}</span>
                    <span style={{ color: r.color }}>{r.count}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{
                      width: r.total > 0 ? `${(r.count / r.total) * 100}%` : '0%',
                      background: r.color,
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  )
}
