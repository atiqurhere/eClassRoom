'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { SectionCard } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CalendarDays, Plus, Trash2, RefreshCw } from 'lucide-react'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function AdminSchedulePage() {
  const [schedules, setSchedules] = useState<any[]>([])
  const [classes, setClasses]     = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [filterClass, setFilterClass] = useState('')
  // v2: schedules belong to class_id only (no course_id column)
  const [form, setForm] = useState({ class_id: '', day: 'Mon', start_time: '08:00', end_time: '09:00' })

  const fetchData = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const url = filterClass ? `/api/schedule?classId=${filterClass}` : '/api/schedule'
    const [sRes, cRes] = await Promise.all([
      fetch(url).then(r => r.json()),
      supabase.from('classes').select('id, class_name, section, courses(name)').order('class_name'),
    ])
    setSchedules(sRes.schedules || [])
    setClasses((cRes.data || []) as any[])
    setLoading(false)
  }, [filterClass])

  useEffect(() => { fetchData() }, [fetchData])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.class_id) { toast.error('Select a class'); return }
    if (!form.start_time || !form.end_time) { toast.error('Set start and end time'); return }
    setSaving(true)
    // Only send class_id — schedules.course_id does not exist in v2
    const res  = await fetch('/api/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ class_id: form.class_id, day: form.day, start_time: form.start_time, end_time: form.end_time }),
    })
    const json = await res.json()
    setSaving(false)
    if (!res.ok) { toast.error(json.error || 'Failed to add slot'); return }
    toast.success('Time slot added')
    fetchData()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this time slot?')) return
    const res = await fetch(`/api/schedule?id=${id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Removed'); fetchData() }
    else         toast.error('Failed to remove')
  }

  const byDay: Record<string, any[]> = {}
  DAYS.forEach(d => { byDay[d] = [] })
  schedules.forEach(s => { if (byDay[s.day]) byDay[s.day].push(s) })

  const inp = { width: '100%', padding: '8px 10px', background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.875rem', boxSizing: 'border-box' as const }

  return (
    <div className="space-y-6">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1>Weekly Schedule</h1>
          <p>Manage class timetables</p>
        </div>
        <Button variant="ghost" size="sm" leftIcon={<RefreshCw size={14} />} onClick={fetchData}>Refresh</Button>
      </div>

      <div className="dash-grid-sidebar" style={{ alignItems: 'start' }}>
        {/* Add Slot */}
        <SectionCard title="Add Time Slot" icon={<Plus size={15} style={{ color: 'var(--accent-blue)' }} />}>
          <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '4px 20px 20px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Class *</label>
              <select value={form.class_id}
                onChange={e => setForm(p => ({ ...p, class_id: e.target.value }))}
                required style={inp}>
                <option value="">Choose class…</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.class_name}{c.section ? ` (${c.section})` : ''}{(c.courses as any)?.name ? ` — ${(c.courses as any).name}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Day *</label>
              <select value={form.day} onChange={e => setForm(p => ({ ...p, day: e.target.value }))} style={inp}>
                {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Start *</label>
                <input type="time" value={form.start_time} onChange={e => setForm(p => ({ ...p, start_time: e.target.value }))} style={inp} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>End *</label>
                <input type="time" value={form.end_time} onChange={e => setForm(p => ({ ...p, end_time: e.target.value }))} style={inp} />
              </div>
            </div>

            <Button type="submit" variant="gradient" loading={saving} leftIcon={<Plus size={14} />}>
              {saving ? 'Adding…' : 'Add Slot'}
            </Button>
          </form>
        </SectionCard>

        {/* Timetable */}
        <SectionCard
          title="Timetable"
          icon={<CalendarDays size={15} style={{ color: 'var(--accent-blue)' }} />}
          action={
            <select value={filterClass} onChange={e => setFilterClass(e.target.value)}
              style={{ padding: '5px 10px', background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: 7, color: 'var(--text-primary)', fontSize: '0.8125rem' }}>
              <option value="">All classes</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}{c.section ? ` (${c.section})` : ''}</option>)}
            </select>
          }
        >
          {loading ? (
            <p style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>Loading…</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {DAYS.map(day => (
                <div key={day} style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{day}</p>
                  {byDay[day].length === 0 ? (
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', paddingLeft: 4 }}>No classes</p>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {byDay[day].map(s => (
                        <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'rgba(79,142,247,0.08)', border: '1px solid rgba(79,142,247,0.2)', borderRadius: 9 }}>
                          <div>
                            <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>{s.classes?.class_name}{s.classes?.section ? ` (${s.classes.section})` : ''}</p>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{s.start_time} – {s.end_time}</p>
                          </div>
                          <button onClick={() => handleDelete(s.id)} style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', padding: 2, borderRadius: 4 }}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  )
}
