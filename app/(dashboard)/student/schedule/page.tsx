export const dynamic   = 'force-dynamic'
export const revalidate = 0

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CalendarDays } from 'lucide-react'
import { SectionCard } from '@/components/ui/Card'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default async function StudentSchedulePage() {
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

  const { data: schedules } = classIds.length
    ? await supabase.from('schedules')
        .select('id, day, start_time, end_time, class_id, classes(class_name, section, courses(name))')
        .in('class_id', classIds)
        .order('day')
        .order('start_time')
    : { data: [] }

  const byDay: Record<string, any[]> = {}
  DAYS.forEach(d => { byDay[d] = [] })
  ;(schedules || []).forEach((s: any) => { if (byDay[s.day]) byDay[s.day].push(s) })

  const today      = DAYS[new Date().getDay()]
  const totalItems = (schedules || []).length

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1>My Schedule</h1>
        <p>Weekly class timetable</p>
      </div>

      {classIds.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14 }}>
          <CalendarDays size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Not enrolled in any course yet</p>
          <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: '0.875rem' }}>Your admin will enroll you in a class.</p>
        </div>
      ) : totalItems === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14 }}>
          <CalendarDays size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>No schedule set yet</p>
          <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: '0.875rem' }}>Your teacher will set up the class schedule soon.</p>
        </div>
      ) : (
        <SectionCard title="Weekly Timetable" icon={<CalendarDays size={15} style={{ color: 'var(--accent-blue)' }} />}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {DAYS.map(day => {
              const isToday    = day === today
              const daySlots   = byDay[day] || []
              return (
                <div key={day} style={{
                  display: 'flex', gap: 20, padding: '14px 20px', borderBottom: '1px solid var(--border)',
                  background: isToday ? 'rgba(79,142,247,0.04)' : 'transparent',
                  borderLeft: isToday ? '3px solid var(--accent-blue)' : '3px solid transparent',
                }}>
                  <div style={{ minWidth: 52, paddingTop: 2 }}>
                    <p style={{ fontWeight: 700, fontSize: '0.875rem', color: isToday ? 'var(--accent-blue)' : 'var(--text-secondary)' }}>{day}</p>
                    {isToday && <span style={{ fontSize: '0.6rem', padding: '2px 6px', background: 'rgba(79,142,247,0.15)', color: 'var(--accent-blue)', borderRadius: 100, fontWeight: 700 }}>TODAY</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    {daySlots.length === 0 ? (
                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', paddingTop: 2 }}>No classes</p>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {daySlots.map((s: any) => (
                          <div key={s.id} style={{
                            padding: '8px 14px', background: isToday ? 'rgba(79,142,247,0.12)' : 'var(--bg-hover)',
                            border: isToday ? '1px solid rgba(79,142,247,0.25)' : '1px solid var(--border)', borderRadius: 10
                          }}>
                            <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{(s.classes as any)?.courses?.name || (s.classes as any)?.class_name}</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{s.start_time} – {s.end_time}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </SectionCard>
      )}
    </div>
  )
}
