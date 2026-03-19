'use client'

import { useEffect, useState } from 'react'
import { useParams }    from 'next/navigation'
import { Video, Users, ArrowLeft, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth }      from '@/lib/hooks/useAuth'
import { Button }       from '@/components/ui/Button'
import { Loading }      from '@/components/ui/Loading'
import Link             from 'next/link'
import { toast }        from 'sonner'

export default function StudentLiveClassPage() {
  const { id }    = useParams()
  const { user }  = useAuth()
  const [liveClass, setLiveClass] = useState<any>(null)
  const [loading, setLoading]     = useState(true)
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
      // v2: attendance.student_id IS user.id directly — no students table
      const supabase = createClient()
      const { error } = await supabase.from('attendance').upsert({
        live_class_id: liveClass.id,
        student_id: user.id,
        status: 'present',
        join_time: new Date().toISOString(),
      }, { onConflict: 'live_class_id,student_id', ignoreDuplicates: false })
      if (error) console.warn('Attendance record:', error.message)
    } catch (e) { /* non-critical */ }

    // Open Jitsi room in new tab
    if (liveClass.room_id) {
      window.open(`https://meet.jit.si/${liveClass.room_id}`, '_blank')
    }
    toast.success('Attendance marked — opening meeting room...')
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

  if (liveClass.status !== 'live') return (
    <div className="empty-state pt-20">
      <div className="empty-state-icon"><Video size={28} /></div>
      <h3>{liveClass.status === 'ended' ? 'Class has ended' : 'Class not started yet'}</h3>
      <p>{liveClass.title}</p>
      <Link href="/student/dashboard"><Button variant="secondary" leftIcon={<ArrowLeft size={15} />}>Back to Dashboard</Button></Link>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1>{liveClass.title}</h1>
        <p>
          {(liveClass.classes as any)?.courses?.name} · {(liveClass.classes as any)?.class_name} · Teacher: {(liveClass.users as any)?.full_name}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 24 }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(34,197,94,0.15)' }}>
          <Video size={36} style={{ color: 'var(--accent-green)' }} />
        </div>

        <div style={{ textAlign: 'center' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'rgba(34,197,94,0.12)', color: 'var(--accent-green)', borderRadius: 100, fontSize: '0.8125rem', fontWeight: 700, marginBottom: 12 }}>
            🔴 LIVE NOW
          </span>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>{liveClass.title}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 4 }}>Clicking Join will mark you as present and open the meeting room in a new tab.</p>
        </div>

        <Button variant="gradient" size="lg" leftIcon={<ExternalLink size={18} />} loading={joining} onClick={handleJoin}>
          Join Class
        </Button>

        <Link href="/student/dashboard">
          <Button variant="secondary" leftIcon={<ArrowLeft size={15} />}>Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  )
}