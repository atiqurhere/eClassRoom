export const dynamic   = 'force-dynamic'
export const revalidate = 0

import { createClient } from '@/lib/supabase/server'
import { redirect }     from 'next/navigation'
import { ProtectedPlayer } from '@/components/video/ProtectedPlayer'
import { SectionCard }  from '@/components/ui/Card'
import { Video }        from 'lucide-react'

export default async function StudentRecordingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // v2: get student's enrolled courses → class IDs
  const { data: enrollments } = await supabase
    .from('course_enrollments')
    .select('course_id, courses(id, name, classes(id))')
    .eq('student_id', user.id)

  const classIds = (enrollments || [])
    .flatMap((e: any) => (e.courses?.classes || []).map((c: any) => c.id))
    .filter(Boolean)

  const { data: sessions } = classIds.length
    ? await supabase
        .from('live_classes')
        .select('id, title, recording_url, start_time, class_id, classes(class_name, courses(name))')
        .in('class_id', classIds)
        .not('recording_url', 'is', null)
        .order('start_time', { ascending: false })
    : { data: [] }

  const recordings = (sessions || []) as any[]

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1>Class Recordings</h1>
        <p>Watch recordings from your live class sessions</p>
      </div>

      {classIds.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14 }}>
          <Video size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Not enrolled in any course yet</p>
          <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: '0.875rem' }}>Contact your admin to get enrolled.</p>
        </div>
      ) : recordings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14 }}>
          <Video size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>No recordings yet</p>
          <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: '0.875rem' }}>Your teacher will add recordings after class sessions.</p>
        </div>
      ) : (
        <SectionCard title={`Recordings (${recordings.length})`} icon={<Video size={15} style={{ color: 'var(--accent-blue)' }} />}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20, padding: 20 }}>
            {recordings.map(r => (
              <div key={r.id} style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
                <ProtectedPlayer liveClassId={r.id} title={r.title} />
                <div style={{ padding: '14px 16px' }}>
                  <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9375rem' }}>{r.title}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    {(r.classes as any)?.class_name} · {(r.classes as any)?.courses?.name} · {r.start_time
                      ? new Date(r.start_time).toLocaleDateString('en-US', { dateStyle: 'medium' })
                      : 'Unknown date'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  )
}
