'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Video, Play, StopCircle, Link as LinkIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { JitsiMeeting } from '@/components/live-class/JitsiMeeting'
import { Button } from '@/components/ui/Button'
import { SectionCard } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { toast } from 'sonner'

export default function TeacherLiveClassPage() {
  const { user } = useAuth()
  const params = useSearchParams()

  // Classes assigned to this teacher
  const [myClasses, setMyClasses]       = useState<any[]>([])
  const [selectedClass, setSelectedClass] = useState(params.get('classId') || '')
  const [activeClass, setActiveClass]   = useState<any>(null)
  const [pastClasses, setPastClasses]   = useState<any[]>([])
  const [loading, setLoading]           = useState(false)
  const [starting, setStarting]         = useState(false)
  const [inlineUrl, setInlineUrl]       = useState<Record<string, string>>({})
  const [savingRecId, setSavingRecId]   = useState<string | null>(null)
  const [endedClass, setEndedClass]     = useState<any>(null)
  const [recordingUrl, setRecordingUrl] = useState('')

  const supabase = createClient()

  const fetchMyClasses = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('classes')
      .select('id, class_name, section, course_id, courses(name)')
      .eq('teacher_id', user.id)
      .order('class_name')
    setMyClasses(data || [])
  }, [user])

  const fetchSessions = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('live_classes')
      .select('id, title, status, start_time, end_time, recording_url, class_id, classes(class_name, courses(name))')
      .eq('teacher_id', user.id)
      .order('start_time', { ascending: false })
      .limit(10)
    setPastClasses(data || [])
    const live = (data || []).find((c: any) => c.status === 'live')
    if (live) setActiveClass(live)
  }, [user])

  useEffect(() => { fetchMyClasses(); fetchSessions() }, [fetchMyClasses, fetchSessions])

  const startClass = async () => {
    if (!selectedClass) { toast.error('Please select a class first'); return }
    const cls = myClasses.find(c => c.id === selectedClass)
    setStarting(true)
    try {
      const res = await fetch('/api/live-class/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: selectedClass,
          title: `${cls?.class_name}${cls?.section ? ` (${cls.section})` : ''} — Live Session`,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setActiveClass(data.liveClass)
      toast.success('Live class started!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to start class')
    } finally {
      setStarting(false)
    }
  }

  const endClass = async () => {
    if (!activeClass) return
    setLoading(true)
    try {
      const res = await fetch('/api/live-class/end', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ liveClassId: activeClass.id }),
      })
      if (!res.ok) throw new Error('Failed to end class')
      setEndedClass(activeClass)
      setActiveClass(null)
      setRecordingUrl('')
      toast.success('Class ended! Add your recording link below.')
      fetchSessions()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const saveRecording = async (liveClassId: string, url: string) => {
    if (!url.trim()) { toast.error('Enter a recording URL'); return }
    setSavingRecId(liveClassId)
    await fetch('/api/live-class/recording', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ liveClassId, recordingUrl: url }),
    })
    setSavingRecId(null)
    setInlineUrl(p => ({ ...p, [liveClassId]: '' }))
    toast.success('Recording saved')
    fetchSessions()
  }

  const bdr = '1px solid var(--border)'

  return (
    <div className="space-y-5">
      <div className="page-header">
        <h1>🎥 Live Class</h1>
        <p>Start a live session for one of your assigned classes.</p>
      </div>

      <div className="dash-grid-sidebar" style={{ alignItems: 'start' }}>
        {/* Controls */}
        <div className="space-y-5">
          <SectionCard title="Start a Session" icon={<Play size={15} />}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="form-label">Select Your Class</label>
                <select className="form-input" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                  <option value="">— Choose a class —</option>
                  {myClasses.map(cls => (
                    <option key={cls.id} value={cls.id}>
                      {cls.class_name}{cls.section ? ` (${cls.section})` : ''} — {(cls.courses as any)?.name}
                    </option>
                  ))}
                </select>
                {myClasses.length === 0 && (
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 8 }}>
                    No classes assigned to you yet. Contact admin.
                  </p>
                )}
              </div>

              {!activeClass ? (
                <Button variant="primary" loading={starting} onClick={startClass}
                  leftIcon={<Play size={15} />} disabled={!selectedClass}>
                  Start Live Session
                </Button>
              ) : (
                <Button variant="danger" loading={loading} onClick={endClass}
                  leftIcon={<StopCircle size={15} />}>
                  End Session
                </Button>
              )}
            </div>
          </SectionCard>

          {/* Post-class recording */}
          {endedClass && (
            <SectionCard title="📹 Add Recording" icon={<LinkIcon size={15} />}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  Paste a YouTube or video link for students to watch later.
                </p>
                <input className="form-input" placeholder="https://youtube.com/…" value={recordingUrl}
                  onChange={e => setRecordingUrl(e.target.value)} />
                <Button variant="primary" size="sm" onClick={() => saveRecording(endedClass.id, recordingUrl)}>
                  Save Recording
                </Button>
              </div>
            </SectionCard>
          )}
        </div>

        {/* Live View or Past Sessions */}
        <div>
          {activeClass ? (
            <SectionCard title={`🔴 LIVE: ${activeClass.title}`} icon={<Video size={15} style={{ color: '#ef4444' }} />}>
              <JitsiMeeting roomId={activeClass.room_id} displayName={user?.user_metadata?.full_name || 'Teacher'} />
            </SectionCard>
          ) : (
            <SectionCard title="Past Sessions" icon={<Video size={15} />} scrollable>
              <table className="data-table">
                <thead>
                  <tr><th>Session</th><th>Class</th><th>Course</th><th>Status</th><th>Date</th><th>Recording</th></tr>
                </thead>
                <tbody>
                  {pastClasses.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>No sessions yet</td></tr>
                  ) : pastClasses.map(cls => (
                    <tr key={cls.id}>
                      <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{cls.title}</td>
                      <td>{cls.classes?.class_name || '—'}</td>
                      <td>{(cls.classes as any)?.courses?.name || '—'}</td>
                      <td><StatusBadge status={cls.status} /></td>
                      <td>{cls.start_time ? new Date(cls.start_time).toLocaleDateString() : '—'}</td>
                      <td>
                        {cls.recording_url ? (
                          <a href={cls.recording_url} target="_blank" rel="noreferrer"
                            style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>▶ Watch</a>
                        ) : cls.status === 'ended' ? (
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <input value={inlineUrl[cls.id] || ''} onChange={e => setInlineUrl(p => ({ ...p, [cls.id]: e.target.value }))}
                              placeholder="YouTube URL…"
                              style={{ padding: '4px 8px', fontSize: '0.75rem', background: 'var(--bg-hover)', border: bdr, borderRadius: 6, color: 'var(--text-primary)', width: 140 }} />
                            <button onClick={() => saveRecording(cls.id, inlineUrl[cls.id] || '')}
                              disabled={savingRecId === cls.id}
                              style={{ padding: '4px 10px', background: 'var(--accent-blue)', color: '#fff', border: 'none', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
                              {savingRecId === cls.id ? '…' : 'Save'}
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  )
}
