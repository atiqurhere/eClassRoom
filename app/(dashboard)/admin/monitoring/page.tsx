export const dynamic   = 'force-dynamic'
export const revalidate = 0

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>👁️ Class Monitoring</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: '0.875rem' }}>Live sessions and recent recordings</p>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
            {live.map(cls => (
              <div key={cls.id} style={{ padding: '16px', background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9375rem' }}>{cls.title}</p>
                  <span style={{ fontSize: '0.7rem', padding: '2px 8px', background: '#22c55e20', color: '#22c55e', borderRadius: 100, fontWeight: 700 }}>LIVE {duration(cls.start_time)}</span>
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
      <div style={{ background: card, border: bdr, borderRadius: 14, padding: 20 }}>
        <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>🕐 Recent Sessions</p>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', minWidth: 640 }}>
          <thead>
            <tr style={{ borderBottom: bdr }}>
              {['Session', 'Teacher', 'Course', 'Date', 'Duration', 'Recording'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '8px 10px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>{h}</th>
              ))}
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
                  <tr key={cls.id} style={{ borderBottom: bdr }}>
                    <td style={{ padding: '10px', color: 'var(--text-primary)', fontWeight: 600 }}>{cls.title}</td>
                    <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>{cls.users?.full_name}</td>
                    <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>{cls.courses?.name}</td>
                    <td style={{ padding: '10px', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>{cls.start_time ? new Date(cls.start_time).toLocaleDateString() : '—'}</td>
                    <td style={{ padding: '10px', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>{mins != null ? `${mins}m` : '—'}</td>
                    <td style={{ padding: '10px' }}>
                      {cls.recording_url
                        ? <a href={cls.recording_url} target="_blank" rel="noopener noreferrer" style={{ color: '#4f8ef7', fontWeight: 600, fontSize: '0.8125rem' }}>▶ Watch</a>
                        : <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>—</span>
                      }
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table></div>
      </div>
    </div>
  )
}
