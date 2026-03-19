'use client'

import { useState, useEffect, useCallback } from 'react'
import { Video, Play, Square, ExternalLink, RefreshCw, Clock, Users } from 'lucide-react'
import { createClient }  from '@/lib/supabase/client'
import { useAuth }       from '@/lib/hooks/useAuth'
import { Button }        from '@/components/ui/Button'
import { SectionCard }   from '@/components/ui/Card'
import { SkeletonRow }   from '@/components/ui/Loading'
import { toast }         from 'sonner'

export default function TeacherLiveClassPage() {
  const { user }          = useAuth()
  const [classes, setClasses]           = useState<any[]>([])
  const [sessions, setSessions]         = useState<any[]>([])
  const [loading, setLoading]           = useState(true)
  const [starting, setStarting]         = useState<string | null>(null)
  const [ending, setEnding]             = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const supabase = createClient()
    const [clsRes, sesRes] = await Promise.all([
      supabase
        .from('classes')
        .select('id, class_name, section, courses(name)')
        .eq('teacher_id', user.id)
        .order('class_name'),
      supabase
        .from('live_classes')
        .select('id, title, status, room_id, start_time, class_id, classes(class_name, courses(name))')
        .eq('teacher_id', user.id)
        .order('start_time', { ascending: false })
        .limit(20),
    ])
    setClasses(clsRes.data || [])
    setSessions(sesRes.data || [])
    setLoading(false)
  }, [user])

  useEffect(() => { fetchData() }, [fetchData])

  const startSession = async (classId: string, className: string) => {
    if (!user) return
    setStarting(classId)
    try {
      const res  = await fetch('/api/live-class/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to start')

      // Open Jitsi meeting in new tab
      const roomId = json.liveClass?.room_id
      if (roomId) {
        window.open(`https://meet.jit.si/${roomId}`, '_blank')
      }
      toast.success(`Live session started for ${className}`)
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to start live class')
    } finally {
      setStarting(null)
    }
  }

  const endSession = async (sessionId: string) => {
    setEnding(sessionId)
    try {
      const res  = await fetch('/api/live-class/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ liveClassId: sessionId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to end')
      toast.success('Session ended')
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to end session')
    } finally {
      setEnding(null)
    }
  }

  const rejoinSession = (session: any) => {
    if (session.room_id) {
      window.open(`https://meet.jit.si/${session.room_id}`, '_blank')
    }
  }

  const live    = sessions.filter(s => s.status === 'live')
  const ended   = sessions.filter(s => s.status !== 'live')

  return (
    <div className="space-y-6">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1>Live Classes</h1>
          <p>Start and manage your live class sessions</p>
        </div>
        <Button variant="ghost" size="sm" leftIcon={<RefreshCw size={14} />} onClick={fetchData}>Refresh</Button>
      </div>

      {/* How it works note */}
      <div style={{ padding: '12px 16px', background: 'rgba(79,142,247,0.08)', borderRadius: 10, border: '1px solid rgba(79,142,247,0.2)', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
        📌 Clicking <b>Start Session</b> creates a live class and opens the Jitsi meeting room in a <b>new tab</b>. Share the room link with your students from their dashboard.
      </div>

      <div className="dash-grid-main">
        {/* My Classes → Start session */}
        <SectionCard title="My Classes" icon={<Video size={15} style={{ color: 'var(--accent-blue)' }} />}>
          {loading ? (
            <table className="data-table"><tbody>{[...Array(3)].map((_, i) => <SkeletonRow key={i} />)}</tbody></table>
          ) : classes.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>No classes assigned to you.</p>
          ) : (
            <table className="data-table">
              <thead><tr><th>Class</th><th>Course</th><th style={{ textAlign: 'right' }}>Action</th></tr></thead>
              <tbody>
                {classes.map(cls => {
                  const hasActiveLive = live.some(s => s.class_id === cls.id)
                  const activeSession = live.find(s => s.class_id === cls.id)
                  return (
                    <tr key={cls.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {cls.class_name}{cls.section ? ` (${cls.section})` : ''}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>{(cls.courses as any)?.name}</td>
                      <td style={{ textAlign: 'right' }}>
                        {hasActiveLive ? (
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <Button variant="secondary" size="sm" leftIcon={<ExternalLink size={13} />}
                              onClick={() => rejoinSession(activeSession)}>Re-join</Button>
                            <Button variant="danger" size="sm" leftIcon={<Square size={13} />}
                              loading={ending === activeSession?.id}
                              onClick={() => endSession(activeSession.id)}>End</Button>
                          </div>
                        ) : (
                          <Button variant="gradient" size="sm" leftIcon={<Play size={13} fill="white" />}
                            loading={starting === cls.id}
                            onClick={() => startSession(cls.id, cls.class_name)}>
                            Start Session
                          </Button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </SectionCard>

        {/* Session History */}
        <div className="space-y-5">
          {/* Active sessions */}
          {live.length > 0 && (
            <SectionCard title={`🔴 Live Now (${live.length})`} icon={<Video size={15} style={{ color: 'var(--accent-green)' }} />}>
              <table className="data-table">
                <thead><tr><th>Session</th><th>Class</th><th style={{ textAlign: 'right' }}>Action</th></tr></thead>
                <tbody>
                  {live.map(s => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.title}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>{(s.classes as any)?.class_name}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <Button variant="secondary" size="sm" leftIcon={<ExternalLink size={13} />} onClick={() => rejoinSession(s)}>Open</Button>
                          <Button variant="danger" size="sm" leftIcon={<Square size={13} />} loading={ending === s.id} onClick={() => endSession(s.id)}>End</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </SectionCard>
          )}

          {/* Past sessions */}
          <SectionCard title="Past Sessions" icon={<Clock size={15} style={{ color: 'var(--accent-muted)' }} />} scrollable>
            {loading ? (
              <table className="data-table"><tbody>{[...Array(4)].map((_, i) => <SkeletonRow key={i} />)}</tbody></table>
            ) : ended.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>No past sessions yet.</p>
            ) : (
              <table className="data-table">
                <thead><tr><th>Session</th><th>Class</th><th>Date</th><th style={{ textAlign: 'right' }}>Status</th></tr></thead>
                <tbody>
                  {ended.map(s => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{s.title}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>{(s.classes as any)?.class_name}</td>
                      <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{s.start_time ? new Date(s.start_time).toLocaleDateString() : '—'}</td>
                      <td style={{ textAlign: 'right' }}>
                        <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 700, background: 'var(--bg-hover)', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{s.status}</span>
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
