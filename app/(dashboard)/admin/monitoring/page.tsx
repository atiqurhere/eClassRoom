export const dynamic   = 'force-dynamic'
export const revalidate = 0

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { SectionCard } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'

export default async function AdminMonitoringPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [liveRes, recentRes] = await Promise.all([
    supabase
      .from('live_classes')
      .select('id, title, room_id, start_time, teacher_id, course_id, courses(name, class_id, classes(class_name)), users!live_classes_teacher_id_fkey(full_name)')
      .eq('status', 'live')
      .order('start_time'),
    supabase
      .from('live_classes')
      .select('id, title, start_time, end_time, recording_url, status, courses(name), users!live_classes_teacher_id_fkey(full_name)')
      .eq('status', 'ended')
      .order('start_time', { ascending: false })
      .limit(10),
  ])

  const live   = (liveRes.data || []) as any[]
  const recent = (recentRes.data || []) as any[]
  const card   = 'var(--bg-card)'
  const bdr    = '1px solid var(--border)'

  const duration = (start: string) => {
    const mins = Math.floor((Date.now() - new Date(start).getTime()) / 60000)
    return mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`
  }

  return (
    <div className="space-y-5">
      <div className="page-header">
        <h1>👁️ Class Monitoring</h1>
        <p>Live sessions and recent recordings</p>
      </div>

      {/* Live Now */}
      <div style={{ background: card, border: '1px solid rgba(34,197,94,0.3)', borderRadius: 14, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#22c55e', animation: 'pulse 1.5s infinite' }} />
          <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>Live Now ({live.length})</p>
        </div>
        {live.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>No active classes right now</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(300px, 100%), 1fr))', gap: 12 }}>
            {live.map(cls => (
              <div key={cls.id} style={{ padding: '16px', background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9375rem' }}>{cls.title}</p>
                  <span style={{ fontSize: '0.7rem', padding: '2px 8px', background: '#22c55e20', color: '#22c55e', borderRadius: 100, fontWeight: 700, whiteSpace: 'nowrap', marginLeft: 8 }}>LIVE {duration(cls.start_time)}</span>
                </div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                  👩‍🏫 {cls.users?.full_name} · {cls.courses?.classes?.class_name}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                  Course: {cls.courses?.name}
                </p>
                <Link href={`/admin/monitoring/join/${cls.id}?room=${cls.room_id}`}
                  style={{ display: 'inline-block', padding: '6px 16px', background: '#4f8ef718', color: '#4f8ef7', border: '1px solid #4f8ef730', borderRadius: 8, fontWeight: 700, fontSize: '0.8125rem', textDecoration: 'none' }}>
                  👁️ Join Silently
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Ended */}
      <SectionCard title="🕐 Recent Sessions" scrollable>
        <table className="data-table">
          <thead>
            <tr>
              <th>Session</th>
              <th>Teacher</th>
              <th>Course</th>
              <th>Date</th>
              <th>Duration</th>
              <th>Recording</th>
            </tr>
          </thead>
          <tbody>
            {recent.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>No sessions yet</td></tr>
            ) : (
              recent.map(cls => {
                const mins = cls.start_time && cls.end_time
                  ? Math.floor((new Date(cls.end_time).getTime() - new Date(cls.start_time).getTime()) / 60000)
                  : null
                return (
                  <tr key={cls.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{cls.title}</td>
                    <td>{cls.users?.full_name}</td>
                    <td>{cls.courses?.name}</td>
                    <td>{cls.start_time ? new Date(cls.start_time).toLocaleDateString() : '—'}</td>
                    <td>{mins != null ? `${mins}m` : '—'}</td>
                    <td>
                      {cls.recording_url
                        ? <a href={cls.recording_url} target="_blank" rel="noopener noreferrer" style={{ color: '#4f8ef7', fontWeight: 600 }}>▶ Watch</a>
                        : <span style={{ color: 'var(--text-muted)' }}>—</span>
                      }
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </SectionCard>
    </div>
  )
}
