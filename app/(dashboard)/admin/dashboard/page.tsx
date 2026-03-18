export const dynamic   = 'force-dynamic'
export const revalidate = 0

import { createClient } from '@/lib/supabase/server'
import { redirect }     from 'next/navigation'
import Link             from 'next/link'

async function getAdminStats(supabase: any) {
  const [usersRes, classesRes, liveRes, assignRes] = await Promise.all([
    supabase.from('users').select('id, role, created_at', { count: 'exact' }),
    supabase.from('classes').select('id', { count: 'exact' }),
    supabase.from('live_classes').select('id, title, status, start_time, courses(name)').eq('status', 'live'),
    supabase.from('assignments').select('id', { count: 'exact' }),
  ])
  return {
    totalUsers:       usersRes.count   || 0,
    totalClasses:     classesRes.count || 0,
    liveClasses:      liveRes.data     || [],
    totalAssignments: assignRes.count  || 0,
    users:            usersRes.data    || [],
  }
}

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const stats    = await getAdminStats(supabase)
  const rc       = (role: string) => stats.users.filter((u: any) => u.role === role).length
  const card     = 'var(--bg-card)'
  const border   = '1px solid var(--border)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>Admin Dashboard</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: '0.875rem' }}>Overview of your institution&apos;s learning activity</p>
      </div>

      {/* Stats */}
      <div className="dash-stats-grid">
        {[
          { title: 'Total Users',    value: stats.totalUsers,       sub: `${rc('student')} students, ${rc('teacher')} teachers`, bg: '#4f8ef718', fg: '#4f8ef7', emoji: '👥' },
          { title: 'Active Classes', value: stats.totalClasses,     sub: 'Across all sections',    bg: '#8b5cf618', fg: '#8b5cf6', emoji: '📚' },
          { title: 'Live Right Now', value: stats.liveClasses.length, sub: stats.liveClasses.length > 0 ? 'In session' : 'No sessions', bg: '#22c55e18', fg: '#22c55e', emoji: '📡' },
          { title: 'Assignments',    value: stats.totalAssignments, sub: 'Created by teachers',    bg: '#f59e0b18', fg: '#f59e0b', emoji: '📝' },
        ].map(s => (
          <div key={s.title} style={{ background: card, border, borderRadius: 16, padding: 22 }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', marginBottom: 12 }}>
              {s.emoji}
            </div>
            <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{s.value}</p>
            <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: 2 }}>{s.title}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="dash-grid-main">

        {/* Live Classes */}
        <div style={{ background: card, border, borderRadius: 16, padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>📡 Live Classes</p>
            <Link href="/admin/monitoring" style={{ fontSize: '0.8125rem', color: '#4f8ef7', textDecoration: 'none' }}>View All →</Link>
          </div>
          {stats.liveClasses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '2rem', marginBottom: 6 }}>📭</p>
              <p style={{ fontWeight: 600 }}>No live classes</p>
              <p style={{ fontSize: '0.8125rem', marginTop: 4 }}>No sessions currently active.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {stats.liveClasses.map((cls: any) => (
                <div key={cls.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.18)', borderRadius: 10 }}>
                  <div>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{cls.title}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      {(cls.courses as any)?.name}
                    </p>
                  </div>
                  <span style={{ padding: '3px 10px', background: 'rgba(34,197,94,0.15)', color: '#22c55e', borderRadius: 100, fontSize: '0.7rem', fontWeight: 700 }}>LIVE</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Quick Actions — NO icon JSX in arrays */}
          <div style={{ background: card, border, borderRadius: 16, padding: 22 }}>
            <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 14 }}>⚡ Quick Actions</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Link href="/admin/invites"    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--bg-hover)', borderRadius: 10, textDecoration: 'none' }}>
                <span style={{ fontSize: '1.1rem' }}>🪪</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>Generate IDs</span>
              </Link>
              <Link href="/admin/users"      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--bg-hover)', borderRadius: 10, textDecoration: 'none' }}>
                <span style={{ fontSize: '1.1rem' }}>👥</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>Manage Users</span>
              </Link>
              <Link href="/admin/classes"    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--bg-hover)', borderRadius: 10, textDecoration: 'none' }}>
                <span style={{ fontSize: '1.1rem' }}>📚</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>Manage Classes</span>
              </Link>
              <Link href="/admin/reports"    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--bg-hover)', borderRadius: 10, textDecoration: 'none' }}>
                <span style={{ fontSize: '1.1rem' }}>📊</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>View Reports</span>
              </Link>
              <Link href="/admin/monitoring" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--bg-hover)', borderRadius: 10, textDecoration: 'none' }}>
                <span style={{ fontSize: '1.1rem' }}>🔍</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>Monitor Classes</span>
              </Link>
            </div>
          </div>

          {/* User Distribution */}
          <div style={{ background: card, border, borderRadius: 16, padding: 22 }}>
            <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 14 }}>👤 User Distribution</p>
            {[
              { label: 'Students', count: rc('student'), color: '#22c55e' },
              { label: 'Teachers', count: rc('teacher'), color: '#4f8ef7' },
              { label: 'Admins',   count: rc('admin'),   color: '#ef4444' },
            ].map(r => (
              <div key={r.label} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: 4 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{r.label}</span>
                  <span style={{ color: r.color, fontWeight: 600 }}>{r.count}</span>
                </div>
                <div style={{ height: 4, background: 'var(--bg-secondary)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 2, background: r.color, width: stats.totalUsers > 0 ? `${(r.count / stats.totalUsers) * 100}%` : '0%' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
