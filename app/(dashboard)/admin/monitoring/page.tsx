import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Eye, Video, Users, Clock, RefreshCw } from 'lucide-react'
import { SectionCard } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { AvatarWithName } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminMonitoringPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect(`/${profile?.role}/dashboard`)

  const { data: live } = await supabase
    .from('live_classes')
    .select('id, title, status, room_id, start_time, courses(name, class_id, classes(class_name)), users!live_classes_teacher_id_fkey(full_name, email)')
    .eq('status', 'live')
    .order('start_time', { ascending: false })

  const { data: recent } = await supabase
    .from('live_classes')
    .select('id, title, status, start_time, end_time, recording_url, courses(name), users!live_classes_teacher_id_fkey(full_name)')
    .eq('status', 'ended')
    .order('end_time', { ascending: false })
    .limit(10)

  return (
    <div className="space-y-6">
      <div className="page-header flex items-start justify-between">
        <div>
          <h1>Class Monitoring</h1>
          <p>Real-time oversight of all live sessions</p>
        </div>
        <form>
          <Button variant="secondary" leftIcon={<RefreshCw size={15} />} type="submit">Refresh</Button>
        </form>
      </div>

      {/* Live Now */}
      <SectionCard
        title={`🔴 Live Now (${live?.length || 0})`}
        subtitle="Currently active video sessions"
        icon={<Video size={16} style={{ color: 'var(--accent-green)' }} />}
      >
        {!live?.length ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Video size={28} /></div>
            <h3>No active sessions</h3>
            <p>No live classes are running at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {live.map((cls: any) => (
              <div key={cls.id} className="p-4 rounded-xl"
                style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)' }}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{cls.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {cls.courses?.name} · {cls.courses?.classes?.class_name}
                    </p>
                  </div>
                  <StatusBadge status="live" />
                </div>
                <div className="flex items-center justify-between">
                  <AvatarWithName name={(cls.users as any)?.full_name} subtitle="Teacher" size="xs" />
                  <div className="flex gap-2">
                    <p className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                      <Clock size={11} />
                      {cls.start_time ? new Date(cls.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </p>
                    <a href={`https://meet.jit.si/${cls.room_id}`} target="_blank" rel="noreferrer">
                      <Button variant="success" size="sm" leftIcon={<Eye size={12} />}>Monitor</Button>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Recent Sessions */}
      <SectionCard
        title="Recent Sessions"
        subtitle="Ended classes and recordings"
        icon={<Clock size={16} style={{ color: 'var(--accent-blue)' }} />}
      >
        <table className="data-table">
          <thead>
            <tr><th>Title</th><th>Course</th><th>Teacher</th><th>Ended</th><th>Recording</th></tr>
          </thead>
          <tbody>
            {!recent?.length ? (
              <tr><td colSpan={5} className="text-center py-6" style={{ color: 'var(--text-muted)' }}>No recent sessions</td></tr>
            ) : (
              recent.map((cls: any) => (
                <tr key={cls.id}>
                  <td className="font-medium" style={{ color: 'var(--text-primary)' }}>{cls.title}</td>
                  <td>{cls.courses?.name || '—'}</td>
                  <td><AvatarWithName name={(cls.users as any)?.full_name} size="xs" /></td>
                  <td className="text-xs">
                    {cls.end_time ? new Date(cls.end_time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                  </td>
                  <td>
                    {cls.recording_url ? (
                      <a href={cls.recording_url} target="_blank" rel="noreferrer">
                        <Button variant="ghost" size="sm">▶ Watch</Button>
                      </a>
                    ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>No recording</span>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </SectionCard>
    </div>
  )
}
