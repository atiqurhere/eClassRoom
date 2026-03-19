'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Video, Play, StopCircle, Link as LinkIcon, CalendarDays } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { JitsiMeeting } from '@/components/live-class/JitsiMeeting'
import { Button } from '@/components/ui/Button'
import { SectionCard } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { toast } from 'sonner'
import { SkeletonRow } from '@/components/ui/Loading'

export default function TeacherLiveClassPage() {
  const { user } = useAuth()
  const params = useSearchParams()

  const [myClasses, setMyClasses]       = useState<any[]>([])
  const [selectedClass, setSelectedClass] = useState(params.get('classId') || '')
  const [activeClass, setActiveClass]   = useState<any>(null)
  const [pastClasses, setPastClasses]   = useState<any[]>([])
  const [loading, setLoading]           = useState(true)
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
    setLoading(true)
    const { data } = await supabase
      .from('live_classes')
      .select('id, title, status, start_time, end_time, recording_url, class_id, classes(class_name, courses(name))')
      .eq('teacher_id', user.id)
      .order('start_time', { ascending: false })
      .limit(10)
    setPastClasses(data || [])
    const live = (data || []).find((c: any) => c.status === 'live')
    if (live) setActiveClass(live)
    setLoading(false)
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
    setStarting(true)
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
      setStarting(false)
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
    if (endedClass?.id === liveClassId) setEndedClass(null)
    toast.success('Recording saved')
    fetchSessions()
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1>Live Class</h1>
        <p>Start live video sessions for your classes</p>
      </div>

      <div className="dash-grid-sidebar" style={{ alignItems: 'start' }}>
        {/* Main Area: Active Class or Start Form */}
        <div>
          {activeClass ? (
            <div style={{ background: '#000', borderRadius: 16, overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
              <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-card)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>LIVE</span>
                  </div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{activeClass.title}</span>
                </div>
                <Button variant="danger" size="sm" leftIcon={<StopCircle size={14} />} onClick={endClass} loading={starting}>
                  End Class
                </Button>
              </div>
              <div style={{ height: '70vh', minHeight: 500 }}>
                {user && (
                  <JitsiMeeting
                    roomName={activeClass.room_id}
                    userName={user.email || 'Teacher'}
                    userEmail={user.email || ''}
                    isModerator={true}
                  />
                )}
              </div>
            </div>
          ) : (
            <SectionCard title="Start a Session" icon={<Video size={15} style={{ color: 'var(--accent-blue)' }} />}>
              <div style={{ padding: '20px', textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(79, 142, 247, 0.1)', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <Video size={30} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>Ready to start teaching?</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: '0.875rem', maxWidth: 300, margin: '0 auto 24px' }}>
                  Select a class below to generate a secure meeting link and start your live session instantly.
                </p>
                
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'var(--bg-hover)', padding: '8px', borderRadius: 12 }}>
                  <select 
                    value={selectedClass} 
                    onChange={e => setSelectedClass(e.target.value)}
                    className="form-input"
                    style={{ border: 'none', background: 'var(--bg-card)', minWidth: 200, padding: '10px 14px' }}
                  >
                    <option value="">Select class…</option>
                    {myClasses.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.class_name}{c.section ? ` (${c.section})` : ''} - {(c.courses as any)?.name}
                      </option>
                    ))}
                  </select>
                  <Button variant="gradient" size="md" leftIcon={<Play size={16} />} onClick={startClass} loading={starting} disabled={!selectedClass}>
                    Start Class
                  </Button>
                </div>
              </div>
            </SectionCard>
          )}

          {/* Prompt to add recording after class ends */}
          {endedClass && !activeClass && (
            <div style={{ marginTop: 20, padding: 20, background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent-green)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Video size={16} /></div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Class Ended Successfully</h3>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Paste the recording link (e.g., YouTube, Google Drive) so students can watch later.</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <input 
                  type="url" 
                  placeholder="https://..." 
                  value={recordingUrl} 
                  onChange={e => setRecordingUrl(e.target.value)} 
                  className="form-input flex-1"
                />
                <Button variant="primary" onClick={() => saveRecording(endedClass.id, recordingUrl)} loading={savingRecId === endedClass.id}>
                  Save Link
                </Button>
                <Button variant="ghost" onClick={() => setEndedClass(null)}>Skip</Button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: Past Sessions */}
        <div>
          <SectionCard title="Recent Sessions" icon={<CalendarDays size={15} style={{ color: 'var(--accent-purple)' }} />}>
            {loading ? (
              <table className="data-table"><tbody>{[...Array(3)].map((_, i) => <SkeletonRow key={i} />)}</tbody></table>
            ) : pastClasses.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>No past sessions.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {pastClasses.filter(c => c.status !== 'live').map(c => (
                  <div key={c.id} style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{(c.classes as any)?.class_name}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                          {new Date(c.start_time).toLocaleDateString()}
                        </p>
                      </div>
                      <StatusBadge status="ended" />
                    </div>
                    
                    {c.recording_url ? (
                      <a href={c.recording_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 500, background: 'rgba(79, 142, 247, 0.1)', padding: '6px 10px', borderRadius: 6 }}>
                        <LinkIcon size={12} /> Watch Recording
                      </a>
                    ) : (
                      <div style={{ marginTop: 8 }}>
                        {inlineUrl[c.id] !== undefined ? (
                          <div style={{ display: 'flex', gap: 8 }}>
                            <input 
                              type="url" placeholder="Recording URL" 
                              value={inlineUrl[c.id]} 
                              onChange={e => setInlineUrl(p => ({ ...p, [c.id]: e.target.value }))}
                              className="form-input" style={{ width: '100%', padding: '6px 10px', fontSize: '0.8125rem' }} 
                            />
                            <Button variant="secondary" size="sm" onClick={() => saveRecording(c.id, inlineUrl[c.id])} loading={savingRecId === c.id}>Save</Button>
                          </div>
                        ) : (
                          <button onClick={() => setInlineUrl(p => ({ ...p, [c.id]: '' }))} style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                            + Add Recording Link
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  )
}
