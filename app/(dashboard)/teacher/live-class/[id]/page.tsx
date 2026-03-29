'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Video, ArrowLeft, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Loading } from '@/components/ui/Loading'
import Link from 'next/link'
import { toast } from 'sonner'

export default function TeacherLiveClassDetailPage() {
  const { id }   = useParams()
  const router   = useRouter()
  const { user } = useAuth()
  const [liveClass, setLiveClass] = useState<any>(null)
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('live_classes')
        .select('id, title, status, zoom_start_url, zoom_join_url, recording_url, class_id, classes(class_name)')
        .eq('id', id as string)
        .single()
      setLiveClass(data)
      setLoading(false)
    }
    if (id) fetch()
  }, [id])

  const openZoom = () => {
    const url = liveClass?.zoom_start_url
    if (!url) { toast.error('Zoom URL not available'); return }
    const params = new URLSearchParams({
      zoom:  url,
      name:  user?.full_name || user?.email || 'Teacher',
      title: liveClass.title,
      mod:   '1',
    })
    window.open(`/live-room?${params.toString()}`, '_blank', 'noopener,noreferrer')
  }

  if (loading) return <Loading text="Loading class..." />

  if (!liveClass) return (
    <div className="empty-state pt-20">
      <div className="empty-state-icon"><Video size={28} /></div>
      <h3>Session not found</h3>
      <Link href="/teacher/live-class"><Button variant="secondary" leftIcon={<ArrowLeft size={15} />}>Back</Button></Link>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="page-header flex items-center gap-4">
        <Button variant="ghost" size="sm" leftIcon={<ArrowLeft size={14} />} onClick={() => router.back()}>Back</Button>
        <div>
          <h1>{liveClass.title}</h1>
          <p>{(liveClass.classes as any)?.class_name} · Teacher (Host)</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 60, gap: 24 }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(37,150,252,0.12)' }}>
          <Video size={36} style={{ color: '#2596fc' }} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>{liveClass.title}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 6 }}>
            Open Zoom to host this session as moderator.
          </p>
        </div>
        {liveClass.zoom_start_url ? (
          <Button variant="gradient" size="lg" leftIcon={<ExternalLink size={18} />} onClick={openZoom}>
            Open Zoom (Host)
          </Button>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No Zoom URL — start this session from the Live Classes page.</p>
        )}
        <Link href="/teacher/live-class">
          <Button variant="secondary" leftIcon={<ArrowLeft size={15} />}>Live Classes</Button>
        </Link>
      </div>
    </div>
  )
}
