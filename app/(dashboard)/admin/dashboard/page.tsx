export const dynamic   = 'force-dynamic'
export const revalidate = 0

import { createClient } from '@/lib/supabase/server'
import { redirect }     from 'next/navigation'
import Link             from 'next/link'
import {
  Users, BookOpen, Video, TrendingUp,
  UserPlus, Activity, Eye, BarChart2,
} from 'lucide-react'

async function getAdminStats(supabase: any) {
  const [usersRes, classesRes, liveRes, assignRes] = await Promise.all([
    supabase.from('users').select('id, role, created_at', { count: 'exact' }),
    supabase.from('classes').select('id', { count: 'exact' }),
    supabase.from('live_classes').select('id, title, status, start_time, courses(name)').eq('status', 'live'),
    supabase.from('assignments').select('id', { count: 'exact' }),
  ])
  return {
    totalUsers:       usersRes.count  || 0,
    totalClasses:     classesRes.count || 0,
    liveClasses:      liveRes.data    || [],
    totalAssignments: assignRes.count || 0,
    users:            usersRes.data   || [],
  }
}

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  // Role already verified by (dashboard)/layout.tsx — no need to re-query here

  const stats = await getAdminStats(supabase)

  const roleCount = (role: string) => stats.users.filter((u: any) => u.role === role).length

  const statCards = [
    { title: 'Total Users',   value: stats.totalUsers,            sub: `${roleCount('student')} students, ${roleCount('teacher')} teachers`, icon: <Users size={20} />, color: '#4f8ef7' },
    { title: 'Active Classes',value: stats.totalClasses,          sub: 'Across all sections',                                                  icon: <BookOpen size={20} />, color: '#8b5cf6' },
    { title: 'Live Right Now', value: stats.liveClasses.length,   sub: stats.liveClasses.length > 0 ? 'Classes in session' : 'No active sessions', icon: <Video size={20} />, color: '#22c55e' },
    { title: 'Assignments',    value: stats.totalAssignments,     sub: 'Created by teachers',                                                  icon: <TrendingUp size={20} />, color: '#f59e0b' },
  ]

  const quickActions = [
    { label: 'Generate Student/Teacher IDs', href: '/admin/invites',   icon: <UserPlus size={16} />,  color: '#4f8ef7' },
    { label: 'Manage Users',                 href: '/admin/users',      icon: <Users size={16} />,     color: '#8b5cf6' },
    { label: 'Manage Classes',               href: '/admin/classes',    icon: <BookOpen size={16} />,  color: '#22c55e' },
    { label: 'View Reports',                 href: '/admin/reports',    icon: <BarChart2 size={16} />, color: '#f59e0b' },
    { label: 'Monitor Classes',              href: '/admin/monitoring', icon: <Eye size={16} />,       color: '#ef4444' },
  ]

  const card = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>Admin Dashboard</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>Overview of your institution&apos;s learning activity</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        {statCards.map(s => (
          <div key={s.title} style={card}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${s.color}18`, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              {s.icon}
            </div>
            <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{s.value}</p>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: 2 }}>{s.title}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{s.sub}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
        {/* Live Classes */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Video size={16} style={{ color: '#22c55e' }} />
              <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Live Classes</p>
            </div>
            <Link href="/admin/monitoring" style={{ fontSize: '0.8125rem', color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 500 }}>View All →</Link>
          </div>
          {stats.liveClasses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
              <Video size={32} style={{ marginBottom: 10, opacity: 0.4 }} />
              <p style={{ fontWeight: 600 }}>No live classes</p>
              <p style={{ fontSize: '0.875rem', marginTop: 4 }}>No classes are currently in session.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {stats.liveClasses.map((cls: any) => (
                <div key={cls.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--bg-hover)', borderRadius: 10 }}>
                  <div>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{cls.title}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      {(cls.courses as any)?.name} · Started {cls.start_time ? new Date(cls.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'recently'}
                    </p>
                  </div>
                  <span style={{ padding: '3px 10px', background: 'rgba(34,197,94,0.12)', color: '#22c55e', borderRadius: 100, fontSize: '0.7rem', fontWeight: 700 }}>LIVE</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Activity size={16} style={{ color: 'var(--accent-blue)' }} />
            <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Quick Actions</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {quickActions.map(a => (
              <Link key={a.href} href={a.href} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'var(--bg-hover)', borderRadius: 10, textDecoration: 'none' }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: `${a.color}18`, color: a.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {a.icon}
                </div>
                <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>{a.label}</span>
              </Link>
            ))}
          </div>

          {/* Role Distribution */}
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>User Distribution</p>
            {[
              { label: 'Students', count: roleCount('student'), color: '#22c55e' },
              { label: 'Teachers', count: roleCount('teacher'), color: '#4f8ef7' },
              { label: 'Admins',   count: roleCount('admin'),   color: '#ef4444' },
            ].map(r => (
              <div key={r.label} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: 4 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{r.label}</span>
                  <span style={{ color: r.color, fontWeight: 600 }}>{r.count}</span>
                </div>
                <div style={{ height: 4, background: 'var(--bg-secondary)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: stats.totalUsers > 0 ? `${(r.count / stats.totalUsers) * 100}%` : '0%', background: r.color, borderRadius: 2 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
