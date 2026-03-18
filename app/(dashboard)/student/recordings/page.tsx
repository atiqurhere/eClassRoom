export const dynamic   = 'force-dynamic'
export const revalidate = 0

import { createClient } from '@/lib/supabase/server'
import { redirect }     from 'next/navigation'
import { ProtectedPlayer } from '@/components/video/ProtectedPlayer'

export default async function StudentRecordingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: studentRecord } = await supabase
    .from('students').select('id, class_id').eq('user_id', user.id!).single()

  const classId = studentRecord?.class_id

  const { data: courseIds } = classId
    ? await supabase.from('courses').select('id').eq('class_id', classId)
    : { data: [] }

  const ids = (courseIds || []).map((c: any) => c.id)

  const { data: sessions } = ids.length
    ? await supabase
        .from('live_classes')
        .select('id, title, recording_url, start_time, courses(name)')
        .in('course_id', ids)
        .not('recording_url', 'is', null)
        .order('start_time', { ascending: false })
    : { data: [] }

  const recordings = (sessions || []) as any[]
  const card = 'var(--bg-card)'
  const bdr  = '1px solid var(--border)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>🎬 Class Recordings</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: '0.875rem' }}>
          Recordings from your class — protected, watch-only
        </p>
      </div>

      {!classId && (
        <div style={{ background: card, border: bdr, borderRadius: 14, padding: 40, textAlign: 'center' }}>
          <p style={{ fontSize: '2rem', marginBottom: 8 }}>🎒</p>
          <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Not enrolled in a class yet</p>
          <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>Contact your admin to get enrolled.</p>
        </div>
      )}

      {classId && recordings.length === 0 && (
        <div style={{ background: card, border: bdr, borderRadius: 14, padding: 48, textAlign: 'center' }}>
          <p style={{ fontSize: '2.5rem', marginBottom: 10 }}>📭</p>
          <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>No recordings yet</p>
          <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>Your teacher will add recordings after class sessions.</p>
        </div>
      )}

      {recordings.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 }}>
          {recordings.map(r => (
            <div key={r.id} style={{ background: card, border: bdr, borderRadius: 16, overflow: 'hidden' }}>
              <ProtectedPlayer liveClassId={r.id} title={r.title} />
              <div style={{ padding: '14px 16px' }}>
                <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9375rem' }}>{r.title}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  {(r.courses as any)?.name} · {r.start_time
                    ? new Date(r.start_time).toLocaleDateString('en-US', { dateStyle: 'medium' })
                    : 'Unknown date'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
