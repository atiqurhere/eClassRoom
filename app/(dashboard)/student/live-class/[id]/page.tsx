'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Video, Users, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { JitsiMeeting } from '@/components/live-class/JitsiMeeting'
import { Button } from '@/components/ui/Button'
import { Loading } from '@/components/ui/Loading'
import Link from 'next/link'
import { toast } from 'sonner'

export default function StudentLiveClassPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [liveClass, setLiveClass] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [joined, setJoined] = useState(false)
  const [attendanceId, setAttendanceId] = useState<string | null>(null)

  useEffect(() => {
    const fetchClass = async () => {
      if (!id) return
      const supabase = createClient()
      const { data } = await supabase
        .from('live_classes')
        .select('id, title, status, room_id, start_time, courses(name, classes(class_name)), users!live_classes_teacher_id_fkey(full_name)')
        .eq('id', id as string)
        .single()
      setLiveClass(data)
      setLoading(false)
    }
    fetchClass()
  }, [id])

  const handleJoin = async () => {
    if (!user || !liveClass) return
    try {
      const supabase = createClient()
      const { data: stu } = await supabase.from('students').select('id').eq('user_id', user.id).single()
      if (stu) {
        const { data: att } = await supabase.from('attendance').insert({
          live_class_id: liveClass.id,
          student_id: stu.id,
          status: 'present',
          join_time: new Date().toISOString(),
        }).select('id').single()
        if (att) setAttendanceId(att.id)
      }
    } catch { /* attendance may already exist */ }
    setJoined(true)
  }

  const handleLeave = async () => {
    if (attendanceId) {
      const supabase = createClient()
      await supabase.from('attendance').update({
        leave_time: new Date().toISOString(),
        duration_minutes: Math.round((Date.now() - (liveClass?.start_time ? new Date(liveClass.start_time).getTime() : Date.now())) / 60000),
      }).eq('id', attendanceId)
    }
    setJoined(false)
    toast.success('You have left the class')
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{liveClass.title}</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {liveClass.courses?.name} · {liveClass.courses?.classes?.class_name} · Teacher: {(liveClass.users as any)?.full_name}
          </p>
        </div>
        {joined && (
          <Button variant="danger" onClick={handleLeave} leftIcon={<ArrowLeft size={15} />}>Leave Class</Button>
        )}
      </div>

      {!joined ? (
        <div className="flex flex-col items-center justify-center mt-16 gap-6">
          <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.15)' }}>
            <Video size={36} style={{ color: 'var(--accent-green)' }} />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Ready to join?</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Joining will mark you as present in attendance</p>
          </div>
          <Button variant="gradient" size="lg" leftIcon={<Users size={18} />} onClick={handleJoin}>
            Join {liveClass.title}
          </Button>
        </div>
      ) : (
        <div style={{ height: 560, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
          <JitsiMeeting
            roomName={liveClass.room_id}
            userName={user?.full_name || 'Student'}
            userEmail={user?.email || ''}
            isModerator={false}
            onMeetingEnd={handleLeave}
          />
        </div>
      )}
    </div>
  )
}