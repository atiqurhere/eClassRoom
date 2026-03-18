'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Video, Play, StopCircle, Link as LinkIcon, Save } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { JitsiMeeting } from '@/components/live-class/JitsiMeeting'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Input'
import { SectionCard } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

export default function TeacherLiveClassPage() {
  const { user } = useAuth()
  const params = useSearchParams()
  const [courses, setCourses] = useState<any[]>([])
  const [selectedCourse, setSelectedCourse] = useState(params.get('courseId') || '')
  const [activeClass, setActiveClass] = useState<any>(null)
  const [pastClasses, setPastClasses] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [starting, setStarting] = useState(false)
  const [endedClass, setEndedClass] = useState<any>(null)
  const [recordingUrl, setRecordingUrl] = useState('')
  const [savingRec, setSavingRec] = useState(false)
  const [savingRecId, setSavingRecId] = useState<string | null>(null)
  const [inlineUrl, setInlineUrl] = useState<Record<string, string>>({})

  const fetchCourses = useCallback(async () => {
    if (!user) return
    const supabase = createClient()
    const { data } = await supabase.from('courses').select('id, name, classes(class_name)').eq('teacher_id', user.id)
    setCourses(data || [])
  }, [user])

  const fetchPastClasses = useCallback(async () => {
    if (!user) return
    const supabase = createClient()
    const { data } = await supabase.from('live_classes').select('id, title, status, start_time, end_time, recording_url, courses(name)').eq('teacher_id', user.id).order('start_time', { ascending: false }).limit(8)
    setPastClasses(data || [])
    const live = data?.find((c: any) => c.status === 'live')
    if (live) setActiveClass(live)
  }, [user])

  useEffect(() => { fetchCourses(); fetchPastClasses() }, [fetchCourses, fetchPastClasses])

  const startClass = async () => {
    if (!selectedCourse) { toast.error('Please select a course first'); return }
    const course = courses.find(c => c.id === selectedCourse)
    try {
      setStarting(true)
      const res = await fetch('/api/live-class/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: selectedCourse, title: `${course?.name} - Live Class` }),
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
    try {
      setLoading(true)
      const res = await fetch('/api/live-class/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ liveClassId: activeClass.id }),
      })
      if (!res.ok) throw new Error('Failed to end class')
      setEndedClass(activeClass)
      setActiveClass(null)
      setRecordingUrl('')
      toast.success('Class ended! Add your recording link below.')
      fetchPastClasses()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const saveRecording = async (liveClassId: string, url: string) => {
    if (!url.trim()) { toast.error('Enter a YouTube URL'); return }
    setSavingRec(true); setSavingRecId(liveClassId)
    const res = await fetch('/api/live-class/recording', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ liveClassId, recording_url: url.trim() }),
    })
    const json = await res.json()
    setSavingRec(false); setSavingRecId(null)
    if (!res.ok) { toast.error(json.error || 'Invalid URL'); return }
    toast.success('Recording link saved! Students can now watch it.')
    setEndedClass(null)
    setRecordingUrl('')
    setInlineUrl(p => { const n = { ...p }; delete n[liveClassId]; return n })
    fetchPastClasses()
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1>Live Class</h1>
        <p>Start and manage your video sessions</p>
      </div>

      {/* Recording Link Prompt — shown after ending a class */}
      {endedClass && (
        <div style={{ padding: '18px 20px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 14 }}>
          <p style={{ fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>🎬 Add Recording Link for &quot;{endedClass.title}&quot;</p>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 12 }}>Paste the YouTube Private link so students can watch after class.</p>
          <div style={{ display: 'flex', gap: 10 }}>
            <input value={recordingUrl} onChange={e => setRecordingUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              style={{ flex: 1, padding: '9px 12px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.875rem' }} />
            <Button variant="gradient" leftIcon={<Save size={15} />} loading={savingRec} onClick={() => saveRecording(endedClass.id, recordingUrl)}>Save Link</Button>
            <Button variant="ghost" onClick={() => setEndedClass(null)}>Skip</Button>
          </div>
        </div>
      )}

      {activeClass ? (
        /* Active class view */
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl"
            style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)' }}>
            <div>
              <p className="font-semibold status-live" style={{ color: 'var(--text-primary)' }}>{activeClass.title}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Started {formatDistanceToNow(new Date(activeClass.start_time || Date.now()), { addSuffix: true })}
              </p>
            </div>
            <Button variant="danger" leftIcon={<StopCircle size={16} />} loading={loading} onClick={endClass}>End Class</Button>
          </div>
          <div style={{ height: 520, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
            <JitsiMeeting
              roomName={activeClass.room_id}
              userName={user?.full_name || 'Teacher'}
              userEmail={user?.email || ''}
              isModerator={true}
              onMeetingEnd={endClass}
            />
          </div>
        </div>
      ) : (
        /* Start class panel */
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-1">
            <SectionCard title="Start a Session" icon={<Video size={16} style={{ color: 'var(--accent-green)' }} />}>
              <div className="space-y-4">
                <Select
                  label="Select Course"
                  placeholder="Choose a course..."
                  options={courses.map(c => ({ value: c.id, label: `${c.name} (${(c.classes as any)?.class_name})` }))}
                  value={selectedCourse}
                  onChange={e => setSelectedCourse(e.target.value)}
                />
                <Button variant="gradient" fullWidth leftIcon={<Play size={16} />} loading={starting} onClick={startClass}>
                  Start Live Class
                </Button>
                <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                  Students will be notified automatically
                </p>
              </div>
            </SectionCard>
          </div>

          <div className="xl:col-span-2">
            <SectionCard title="Past Sessions" icon={<Video size={15} style={{ color: 'var(--text-muted)' }} />}>
              <table className="data-table">
                <thead><tr><th>Session</th><th>Course</th><th>Status</th><th>Date</th><th>Recording</th></tr></thead>
                <tbody>
                  {pastClasses.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-8" style={{ color: 'var(--text-muted)' }}>No past sessions</td></tr>
                  ) : (
                    pastClasses.map(cls => (
                      <tr key={cls.id}>
                        <td className="font-medium" style={{ color: 'var(--text-primary)' }}>{cls.title}</td>
                        <td style={{ fontSize: '0.8125rem' }}>{(cls.courses as any)?.name}</td>
                        <td><StatusBadge status={cls.status} /></td>
                        <td className="text-xs">{cls.start_time ? new Date(cls.start_time).toLocaleDateString() : '—'}</td>
                        <td>
                          {cls.recording_url ? (
                            <a href={cls.recording_url} target="_blank" rel="noreferrer">
                              <Button variant="ghost" size="sm" leftIcon={<LinkIcon size={12} />}>Watch</Button>
                            </a>
                          ) : cls.status === 'ended' ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <input
                                value={inlineUrl[cls.id] || ''}
                                onChange={e => setInlineUrl(p => ({ ...p, [cls.id]: e.target.value }))}
                                placeholder="YouTube URL…"
                                style={{ padding: '4px 8px', fontSize: '0.75rem', background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', width: 140 }}
                              />
                              <button
                                onClick={() => saveRecording(cls.id, inlineUrl[cls.id] || '')}
                                disabled={savingRec && savingRecId === cls.id}
                                style={{ padding: '4px 10px', background: '#4f8ef7', color: '#fff', border: 'none', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
                                {savingRec && savingRecId === cls.id ? '…' : 'Save'}
                              </button>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </SectionCard>
          </div>
        </div>
      )}
    </div>
  )
}
