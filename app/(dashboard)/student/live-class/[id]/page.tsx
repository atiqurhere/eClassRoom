'use client'

import { useEffect, useState } from 'react'
import { useParams }     from 'next/navigation'
import { Video, ArrowLeft, ExternalLink, Youtube } from 'lucide-react'
import { createClient }  from '@/lib/supabase/client'
import { useAuth }       from '@/lib/hooks/useAuth'
import { Button }        from '@/components/ui/Button'
import { Loading }       from '@/components/ui/Loading'
import Link              from 'next/link'
import { toast }         from 'sonner'

export default function StudentLiveClassPage() {
  const { id }   = useParams()
  const { user } = useAuth()
  const [liveClass, setLiveClass] = useState<any>(null)
  const [loading, setLoading]     = useState(true)
  const [joining, setJoining]     = useState(false)

  useEffect(() => {
    const fetchClass = async () => {
      if (!id) return
      const supabase = createClient()
      const { data } = await supabase
        .from('live_classes')
        .select('id, title, status, zoom_join_url, recording_url, start_time, class_id, classes(class_name, courses(name)), users!live_classes_teacher_id_fkey(full_name)')
        .eq('id', id as string)
        .single()
      setLiveClass(data)
      setLoading(false)
    }
    fetchClass()
  }, [id])

  const handleJoin = async () => {
    if (!user || !liveClass) return
    setJoining(true)
    try {
      // Mark attendance
      const supabase = createClient()
      const { error } = await supabase.from('attendance').upsert({
        live_class_id: liveClass.id,
        student_id:    user.id,
        status:        'present',
        join_time:     new Date().toISOString(),
      }, { onConflict: 'live_class_id,student_id', ignoreDuplicates: false })
      if (error) console.warn('Attendance error (non-critical):', error.message)
    } catch (e) { /* attendance is non-critical */ }

    toast.success('Attendance marked ✓ — opening Zoom')

    // Open Zoom join URL via /live-room relay
    const params = new URLSearchParams({
      zoom:  liveClass.zoom_join_url || '',
      name:  user.full_name || user.email || 'Student',
      title: liveClass.title,
    })
    window.open(`/live-room?${params.toString()}`, '_blank', 'noopener,noreferrer')
    setJoining(false)
  }

  if (loading) return <Loading text="Loading class..." />

  if (!liveClass) return (
    <div className="empty-state pt-20">
      <div className="empty-state-icon"><Video size={28} /></div>
      <h3>Class not found</h3>
      <Link href="/student/classes"><Button variant="secondary" leftIcon={<ArrowLeft size={15} />}>Back to Classes</Button></Link>
    </div>
  )

  // ── Ended class with recording ────────────────────────────────────────────
  if (liveClass.status === 'ended' && liveClass.recording_url) {
    return (
      <div className="empty-state pt-20">
        <div className="empty-state-icon" style={{ background: 'rgba(255,0,0,0.1)' }}><Youtube size={28} style={{ color: '#f00' }} /></div>
        <h3>Recording Available</h3>
        <p>{liveClass.title}</p>
        <a href={liveClass.recording_url} target="_blank" rel="noopener noreferrer">
          <Button variant="gradient" leftIcon={<ExternalLink size={15} />}>Watch on YouTube</Button>
        </a>
        <Link href="/student/dashboard"><Button variant="secondary" leftIcon={<ArrowLeft size={15} />}>Back to Dashboard</Button></Link>
      </div>
    )
  }

  // ── Ended class — recording processing ───────────────────────────────────
  if (liveClass.status === 'ended') {
    return (
      <div className="empty-state pt-20">
        <div className="empty-state-icon"><Video size={28} /></div>
        <h3>Class has ended</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', maxWidth: 360, textAlign: 'center' }}>
          The recording is being processed and will be uploaded to YouTube shortly. Check back in a few minutes.
        </p>
        <Link href="/student/dashboard"><Button variant="secondary" leftIcon={<ArrowLeft size={15} />}>Back to Dashboard</Button></Link>
      </div>
    )
  }

  // ── Not started yet ───────────────────────────────────────────────────────
  if (liveClass.status !== 'live') {
    return (
      <div className="empty-state pt-20">
        <div className="empty-state-icon"><Video size={28} /></div>
        <h3>Class not started yet</h3>
        <p>{liveClass.title}</p>
        <Link href="/student/dashboard"><Button variant="secondary" leftIcon={<ArrowLeft size={15} />}>Back to Dashboard</Button></Link>
      </div>
    )
  }

  // ── Live — Pre-join screen ────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1>{liveClass.title}</h1>
        <p>{(liveClass.classes as any)?.courses?.name} · {(liveClass.classes as any)?.class_name}</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 60, gap: 24 }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(37,150,252,0.12)' }}>
          <Video size={36} style={{ color: '#2596fc' }} />
        </div>

        <div style={{ textAlign: 'center' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'rgba(34,197,94,0.12)', color: 'var(--accent-green)', borderRadius: 100, fontSize: '0.8125rem', fontWeight: 700, marginBottom: 12 }}>
            🔴 LIVE NOW — Zoom
          </span>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>{liveClass.title}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 6, maxWidth: 380 }}>
            Teacher: <b>{(liveClass.users as any)?.full_name}</b><br />
            Clicking Join will mark your attendance and open Zoom in a new tab.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <Button variant="gradient" size="lg" leftIcon={<ExternalLink size={18} />} loading={joining} onClick={handleJoin}>
            Join via Zoom
          </Button>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Your browser may ask to allow popups — please click Allow.
          </p>
        </div>

        <Link href="/student/dashboard">
          <Button variant="secondary" leftIcon={<ArrowLeft size={15} />}>Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  )
}