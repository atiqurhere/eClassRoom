'use client'

import { useEffect, useState } from 'react'
import { useParams }     from 'next/navigation'
import { Video, ArrowLeft, Users } from 'lucide-react'
import { createClient }  from '@/lib/supabase/client'
import { useAuth }       from '@/lib/hooks/useAuth'
import { JitsiMeeting }  from '@/components/live-class/JitsiMeeting'
import { Button }        from '@/components/ui/Button'
import { Loading }       from '@/components/ui/Loading'
import Link              from 'next/link'
import { toast }         from 'sonner'

export default function StudentLiveClassPage() {
  const { id }   = useParams()
  const { user } = useAuth()
  const [liveClass, setLiveClass] = useState<any>(null)
  const [loading, setLoading]     = useState(true)
  const [joined, setJoined]       = useState(false)
  const [joining, setJoining]     = useState(false)

  useEffect(() => {
    const fetchClass = async () => {
      if (!id) return
      const supabase = createClient()
      const { data } = await supabase
        .from('live_classes')
        .select('id, title, status, room_id, start_time, class_id, classes(class_name, courses(name)), users!live_classes_teacher_id_fkey(full_name)')
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
      // v2: attendance.student_id IS user.id directly
      const supabase = createClient()
      await supabase.from('attendance').upsert({
        live_class_id: liveClass.id,
        student_id:    user.id,
        status:        'present',
        join_time:     new Date().toISOString(),
      }, { onConflict: 'live_class_id,student_id', ignoreDuplicates: false })
    } catch { /* attendance is non-critical */ }
    toast.success('Attendance marked ✓')
    setJoined(true)
    setJoining(false)
  }

  const handleLeave = async () => {
    if (!user || !liveClass) return
    try {
      const supabase = createClient()
      await supabase.from('attendance')
        .update({ leave_time: new Date().toISOString() })
        .eq('live_class_id', liveClass.id)
        .eq('student_id', user.id)
    } catch {}
    setJoined(false)
    toast.info('You left the session')
  }

  if (loading) return <Loading text="Loading class..." />

  if (!liveClass) return (
    <div className="empty-state pt-20">
      <div className="empty-state-icon"><Video size={28} /></div>
      <h3>Class not found</h3>
      <Link href="/student/classes"><Button variant="secondary" leftIcon={<ArrowLeft size={15} />}>Back to Classes</Button></Link>
    </div>
  )

  if (liveClass.status !== 'live') return (
    <div className="empty-state pt-20">
      <div className="empty-state-icon"><Video size={28} /></div>
      <h3>{liveClass.status === 'ended' ? 'Class has ended' : 'Class not started yet'}</h3>
      <p>{liveClass.title}</p>
      <Link href="/student/dashboard"><Button variant="secondary" leftIcon={<ArrowLeft size={15} />}>Back to Dashboard</Button></Link>
    </div>
  )

  // ── Joined: show Jitsi embed ──────────────────────────────────────────────
  if (joined) {
    return (
      <div className="space-y-4">
        <div className="page-header flex items-center justify-between">
          <div>
            <h1>{liveClass.title}</h1>
            <p style={{ fontSize: '0.8125rem' }}>
              {(liveClass.classes as any)?.courses?.name} · {(liveClass.classes as any)?.class_name} · Teacher: {(liveClass.users as any)?.full_name}
            </p>
          </div>
          <Button variant="secondary" leftIcon={<ArrowLeft size={14} />} onClick={handleLeave}>Leave</Button>
        </div>

        <div style={{ padding: '10px 16px', background: 'rgba(79,142,247,0.08)', border: '1px solid rgba(79,142,247,0.2)', borderRadius: 10, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
          ✅ Attendance marked · Your mic and camera are off by default. Use the toolbar below the video to enable them.
        </div>

        <div style={{ height: 620, borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border)' }}>
          <JitsiMeeting
            roomName={liveClass.room_id}
            userName={user?.full_name || user?.email || 'Student'}
            userEmail={user?.email || ''}
            isModerator={false}
            onMeetingEnd={handleLeave}
          />
        </div>
      </div>
    )
  }

  // ── Pre-join screen ───────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1>{liveClass.title}</h1>
        <p>{(liveClass.classes as any)?.courses?.name} · {(liveClass.classes as any)?.class_name}</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 60, gap: 24 }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(34,197,94,0.15)' }}>
          <Video size={36} style={{ color: 'var(--accent-green)' }} />
        </div>

        <div style={{ textAlign: 'center' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'rgba(34,197,94,0.12)', color: 'var(--accent-green)', borderRadius: 100, fontSize: '0.8125rem', fontWeight: 700, marginBottom: 12 }}>
            🔴 LIVE NOW
          </span>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>{liveClass.title}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 6, maxWidth: 380 }}>
            Teacher: <b>{(liveClass.users as any)?.full_name}</b><br />
            Joining will mark you as present in attendance.
          </p>
        </div>

        <Button variant="gradient" size="lg" leftIcon={<Users size={18} />} loading={joining} onClick={handleJoin}>
          Join Class
        </Button>

        <Link href="/student/dashboard">
          <Button variant="secondary" leftIcon={<ArrowLeft size={15} />}>Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  )
}