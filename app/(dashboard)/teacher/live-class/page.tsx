'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Video, Play, Square, RefreshCw, Clock, Users, Maximize2, X } from 'lucide-react'
import { createClient }  from '@/lib/supabase/client'
import { useAuth }       from '@/lib/hooks/useAuth'
import { Button }        from '@/components/ui/Button'
import { SectionCard }   from '@/components/ui/Card'
import { SkeletonRow }   from '@/components/ui/Loading'
import { JitsiMeeting }  from '@/components/live-class/JitsiMeeting'
import { toast }         from 'sonner'

export default function TeacherLiveClassPage() {
  const { user, loading: authLoading } = useAuth()
  const [classes, setClasses]   = useState<any[]>([])
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [starting, setStarting] = useState<string | null>(null)
  const [ending, setEnding]     = useState<string | null>(null)
  // Active session being displayed in the Jitsi embed
  const [activeSession, setActiveSession] = useState<{ id: string; title: string; room_id: string } | null>(null)

  const fetchData = useCallback(async () => {
    if (authLoading) return               // auth still initialising
    if (!user) { setLoading(false); return }  // not logged in
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
        .limit(30),
    ])
    setClasses(clsRes.data || [])
    setSessions(sesRes.data || [])
    setLoading(false)
  }, [user])

  useEffect(() => { fetchData() }, [fetchData, authLoading])

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
      const lc = json.liveClass
      toast.success(`Session started for ${className}`)
      fetchData()
      // Open Jitsi embed in-page
      if (lc?.room_id) {
        setActiveSession({ id: lc.id, title: lc.title || className, room_id: lc.room_id })
      }
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
      if (activeSession?.id === sessionId) setActiveSession(null)
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to end session')
    } finally {
      setEnding(null)
    }
  }

  const handleMeetingEnd = () => {
    // When teacher clicks "Leave" inside Jitsi, also end the session
    if (activeSession) endSession(activeSession.id)
  }

  const live  = sessions.filter(s => s.status === 'live')
  const ended = sessions.filter(s => s.status !== 'live')

  // If Jitsi is open, show the full-screen embed
  if (activeSession) {
    return (
      <div className="space-y-4">
        <div className="page-header flex items-center justify-between">
          <div>
            <h1>{activeSession.title}</h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              🔴 Live Now · Room: <code style={{ fontSize: '0.75rem', background: 'var(--bg-hover)', padding: '2px 6px', borderRadius: 4 }}>{activeSession.room_id}</code>
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="danger" leftIcon={<Square size={14} />}
              loading={ending === activeSession.id}
              onClick={() => endSession(activeSession.id)}>
              End Session
            </Button>
            <Button variant="secondary" leftIcon={<X size={14} />}
              onClick={() => setActiveSession(null)}>
              Minimise
            </Button>
          </div>
        </div>

        {/* Info bar */}
        <div style={{ padding: '10px 16px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 10, fontSize: '0.8125rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
          As the <b>teacher</b> you are the moderator. You can mute participants, record the session, and control the meeting.
        </div>

        {/* Jitsi embed */}
        <div style={{ height: 620, borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border)' }}>
          <JitsiMeeting
            roomName={activeSession.room_id}
            userName={user?.full_name || user?.email || 'Teacher'}
            userEmail={user?.email || ''}
            isModerator={true}
            onMeetingEnd={handleMeetingEnd}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1>Live Classes</h1>
          <p>Start and manage live sessions. You will be the moderator with full controls.</p>
        </div>
        <Button variant="ghost" size="sm" leftIcon={<RefreshCw size={14} />} onClick={fetchData}>Refresh</Button>
      </div>

      {/* Jump back into live session */}
      {live.length > 0 && (
        <div style={{ padding: '14px 16px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e', display: 'inline-block', boxShadow: '0 0 0 3px rgba(34,197,94,0.25)' }} />
            <div>
              <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9375rem' }}>{live[0].title} — Live now</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{(live[0].classes as any)?.class_name}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="gradient" size="sm" leftIcon={<Video size={14} />}
              onClick={() => setActiveSession({ id: live[0].id, title: live[0].title, room_id: live[0].room_id })}>
              Re-join
            </Button>
            <Button variant="danger" size="sm" leftIcon={<Square size={14} />}
              loading={ending === live[0].id}
              onClick={() => endSession(live[0].id)}>
              End
            </Button>
          </div>
        </div>
      )}

      <div className="dash-grid-main">
        {/* Classes → Start */}
        <SectionCard title="My Classes" icon={<Users size={15} style={{ color: 'var(--accent-blue)' }} />}>
          {loading ? (
            <table className="data-table"><tbody>{[...Array(3)].map((_, i) => <SkeletonRow key={i} />)}</tbody></table>
          ) : classes.length === 0 ? (
            <p style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)', fontSize: '0.875rem' }}>No classes assigned to you.</p>
          ) : (
            <table className="data-table">
              <thead><tr><th>Class</th><th>Course</th><th style={{ textAlign: 'right' }}>Action</th></tr></thead>
              <tbody>
                {classes.map(cls => {
                  const liveSes = live.find(s => s.class_id === cls.id)
                  return (
                    <tr key={cls.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {cls.class_name}{cls.section ? ` (${cls.section})` : ''}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>{(cls.courses as any)?.name}</td>
                      <td style={{ textAlign: 'right' }}>
                        {liveSes ? (
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <Button variant="gradient" size="sm" leftIcon={<Video size={13} />}
                              onClick={() => setActiveSession({ id: liveSes.id, title: liveSes.title, room_id: liveSes.room_id })}>
                              Join
                            </Button>
                            <Button variant="danger" size="sm" leftIcon={<Square size={13} />}
                              loading={ending === liveSes.id}
                              onClick={() => endSession(liveSes.id)}>
                              End
                            </Button>
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

        {/* Past sessions */}
        <SectionCard title="Past Sessions" icon={<Clock size={15} style={{ color: 'var(--text-muted)' }} />} scrollable>
          {loading ? (
            <table className="data-table"><tbody>{[...Array(4)].map((_, i) => <SkeletonRow key={i} />)}</tbody></table>
          ) : ended.length === 0 ? (
            <p style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)', fontSize: '0.875rem' }}>No past sessions yet.</p>
          ) : (
            <table className="data-table">
              <thead><tr><th>Session</th><th>Class</th><th>Date</th><th style={{ textAlign: 'right' }}>Status</th></tr></thead>
              <tbody>
                {ended.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{s.title}</td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{(s.classes as any)?.class_name}</td>
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
  )
}
