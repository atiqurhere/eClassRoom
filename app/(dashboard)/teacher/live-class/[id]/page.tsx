'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth }      from '@/lib/hooks/useAuth'
import { Button }       from '@/components/ui/Button'
import { Loading }      from '@/components/ui/Loading'
import { ArrowLeft, ExternalLink, Square } from 'lucide-react'
import { toast } from 'sonner'

/**
 * /teacher/live-class/[id]
 * Deep-link page for a specific live class session.
 * Opens Zoom directly; does not embed anything.
 */
export default function TeacherLiveClassDetailPage() {
  const { id }  = useParams()
  const router  = useRouter()
  const { user } = useAuth()
  const [liveClass, setLiveClass] = useState<any>(null)
  const [loading,   setLoading]   = useState(true)
  const [ending,    setEnding]    = useState(false)

  useEffect(() => {
    if (!id) return
    const supabase = createClient()
    supabase
      .from('live_classes')
      .select('id, title, status, zoom_start_url, zoom_meeting_id, class_id, classes(class_name, courses(name))')
      .eq('id', id as string)
      .single()
      .then(({ data }) => {
        setLiveClass(data)
        setLoading(false)

        // Auto-open Zoom if meeting is live
        if (data?.zoom_start_url && data?.status === 'live') {
          window.open(data.zoom_start_url, '_blank', 'noopener,noreferrer')
        }
      })
  }, [id])

  const endSession = async () => {
    if (!liveClass) return
    setEnding(true)
    try {
      const res  = await fetch('/api/live-class/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ liveClassId: liveClass.id }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to end')
      toast.success('Session ended — recording will be uploaded to YouTube automatically')
      router.push('/teacher/live-class')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setEnding(false)
    }
  }

  if (loading) return <Loading text="Loading session..." />

  if (!liveClass) return (
    <div className="empty-state pt-20">
      <h3>Session not found</h3>
      <Button variant="secondary" leftIcon={<ArrowLeft size={15} />} onClick={() => router.back()}>Back</Button>
    </div>
  )

  const { classes } = liveClass as any

  return (
    <div className="space-y-6">
      <div className="page-header flex items-center justify-between">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button variant="ghost" onClick={() => router.back()} leftIcon={<ArrowLeft size={16} />}>Back</Button>
          <div>
            <h1>{liveClass.title}</h1>
            <p>{classes?.courses?.name} · {classes?.class_name}</p>
          </div>
        </div>
        {liveClass.status === 'live' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block', animation: 'pulse 2s infinite' }} />
            <span style={{ color: '#22c55e', fontSize: '0.875rem', fontWeight: 700 }}>LIVE</span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, paddingTop: 40 }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          {liveClass.status === 'live'
            ? 'Zoom opened automatically. Use the button below if it did not open.'
            : 'This session has ended.'}
        </p>

        <div style={{ display: 'flex', gap: 12 }}>
          {liveClass.zoom_start_url && liveClass.status === 'live' && (
            <Button
              variant="gradient"
              leftIcon={<ExternalLink size={15} />}
              onClick={() => window.open(liveClass.zoom_start_url, '_blank', 'noopener,noreferrer')}
            >
              Open Zoom (Host)
            </Button>
          )}
          {liveClass.status === 'live' && (
            <Button
              variant="danger"
              leftIcon={<Square size={15} />}
              loading={ending}
              onClick={endSession}
            >
              End Session
            </Button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}
