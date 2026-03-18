export const dynamic   = 'force-dynamic'
export const revalidate = 0

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default async function StudentSchedulePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: studentRecord } = await supabase
    .from('students').select('class_id').eq('user_id', user.id!).single()

  const classId = studentRecord?.class_id
  const { data: schedules } = classId
    ? await supabase.from('schedules')
        .select('id, day, start_time, end_time, courses(name)')
        .eq('class_id', classId)
        .order('day')
        .order('start_time')
    : { data: [] }

  const byDay: Record<string, any[]> = {}
  DAYS.forEach(d => { byDay[d] = [] })
  ;(schedules || []).forEach((s: any) => { if (byDay[s.day]) byDay[s.day].push(s) })

  const today = DAYS[new Date().getDay()]
  const card  = 'var(--bg-card)'
  const bdr   = '1px solid var(--border)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>📅 My Schedule</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: '0.875rem' }}>Weekly class timetable</p>
      </div>

      {!classId && (
        <div style={{ background: card, border: bdr, borderRadius: 14, padding: 40, textAlign: 'center' }}>
          <p style={{ fontSize: '2rem', marginBottom: 8 }}>📋</p>
          <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Not enrolled in a class yet</p>
          <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>Your admin will enroll you in a class.</p>
        </div>
      )}

      {classId && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {DAYS.map(day => {
            const isToday = day === today
            return (
              <div key={day} style={{ background: card, border: isToday ? '1px solid rgba(79,142,247,0.4)' : bdr, borderRadius: 14, padding: '14px 18px', boxShadow: isToday ? '0 0 0 3px rgba(79,142,247,0.08)' : undefined }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: byDay[day].length ? 10 : 0 }}>
                  <p style={{ fontWeight: 700, color: isToday ? '#4f8ef7' : 'var(--text-secondary)', fontSize: '0.875rem', minWidth: 36 }}>{day}</p>
                  {isToday && <span style={{ fontSize: '0.65rem', padding: '2px 8px', background: '#4f8ef718', color: '#4f8ef7', borderRadius: 100, fontWeight: 700 }}>TODAY</span>}
                </div>
                {byDay[day].length === 0
                  ? <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginLeft: 46 }}>No classes</p>
                  : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginLeft: 46 }}>
                      {byDay[day].map((s: any) => (
                        <div key={s.id} style={{ padding: '8px 14px', background: isToday ? '#4f8ef718' : 'var(--bg-hover)', border: isToday ? '1px solid #4f8ef730' : bdr, borderRadius: 10 }}>
                          <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{s.courses?.name}</p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{s.start_time} – {s.end_time}</p>
                        </div>
                      ))}
                    </div>
                  )
                }
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
