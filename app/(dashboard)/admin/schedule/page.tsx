'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function AdminSchedulePage() {
  const [schedules, setSchedules] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [filterClass, setFilterClass] = useState('')
  const [form, setForm] = useState({ class_id: '', course_id: '', day: 'Mon', start_time: '08:00', end_time: '09:00' })
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)
    const url = filterClass ? `/api/schedule?classId=${filterClass}` : '/api/schedule'
    const [sRes, cRes, crRes] = await Promise.all([
      fetch(url).then(r => r.json()),
      supabase.from('classes').select('id, class_name').order('class_name'),
      supabase.from('courses').select('id, name, class_id').order('name'),
    ])
    setSchedules(sRes.schedules || [])
    setClasses((cRes.data || []) as any[])
    setCourses((crRes.data || []) as any[])
    setLoading(false)
  }, [filterClass])

  useEffect(() => { fetchData() }, [fetchData])

  const filteredCourses = form.class_id ? courses.filter(c => c.class_id === form.class_id) : courses

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.class_id || !form.course_id) { toast.error('Select class and course'); return }
    setSaving(true)
    const res = await fetch('/api/schedule', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const json = await res.json()
    setSaving(false)
    if (!res.ok) { toast.error(json.error || 'Failed'); return }
    toast.success('Slot added')
    fetchData()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this time slot?')) return
    const res = await fetch(`/api/schedule?id=${id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Removed'); fetchData() }
    else toast.error('Failed to remove')
  }

  const card = 'var(--bg-card)'
  const bdr  = '1px solid var(--border)'
  const inp  = { width: '100%', padding: '8px 10px', background: 'var(--bg-hover)', border: bdr, borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.875rem', boxSizing: 'border-box' as const }

  // Group by day
  const byDay: Record<string, any[]> = {}
  DAYS.forEach(d => { byDay[d] = [] })
  schedules.forEach(s => { if (byDay[s.day]) byDay[s.day].push(s) })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>📅 Weekly Schedule</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: '0.875rem' }}>Manage class timetables</p>
      </div>

      <div className="dash-grid-main">
        {/* Add Slot */}
        <div style={{ background: card, border: bdr, borderRadius: 14, padding: 18 }}>
          <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>➕ Add Time Slot</p>
          <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Class *', el: <select value={form.class_id} onChange={e => setForm(p => ({ ...p, class_id: e.target.value, course_id: '' }))} required style={inp}><option value="">Choose class…</option>{classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}</select> },
              { label: 'Course *', el: <select value={form.course_id} onChange={e => setForm(p => ({ ...p, course_id: e.target.value }))} required style={inp}><option value="">Choose course…</option>{filteredCourses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select> },
              { label: 'Day *', el: <select value={form.day} onChange={e => setForm(p => ({ ...p, day: e.target.value }))} style={inp}>{DAYS.map(d => <option key={d} value={d}>{d}</option>)}</select> },
              { label: 'Start Time *', el: <input type="time" value={form.start_time} onChange={e => setForm(p => ({ ...p, start_time: e.target.value }))} style={inp} /> },
              { label: 'End Time *', el: <input type="time" value={form.end_time} onChange={e => setForm(p => ({ ...p, end_time: e.target.value }))} style={inp} /> },
            ].map(({ label, el }) => (
              <div key={label}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>{label}</label>
                {el}
              </div>
            ))}
            <button type="submit" disabled={saving}
              style={{ marginTop: 4, padding: '9px', background: saving ? '#666' : 'linear-gradient(135deg,#4f8ef7,#8b5cf6)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? 'Adding…' : '+ Add Slot'}
            </button>
          </form>
        </div>

        {/* Timetable */}
        <div style={{ background: card, border: bdr, borderRadius: 14, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <p style={{ fontWeight: 700, color: 'var(--text-primary)' }}>📋 Timetable</p>
            <select value={filterClass} onChange={e => setFilterClass(e.target.value)}
              style={{ padding: '6px 10px', background: 'var(--bg-hover)', border: bdr, borderRadius: 7, color: 'var(--text-primary)', fontSize: '0.8125rem' }}>
              <option value="">All classes</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
            </select>
          </div>
          {loading ? <p style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>Loading…</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {DAYS.map(day => (
                <div key={day}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{day}</p>
                  {byDay[day].length === 0
                    ? <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', paddingLeft: 8 }}>No classes</p>
                    : <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {byDay[day].map(s => (
                          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#4f8ef718', border: '1px solid #4f8ef730', borderRadius: 9 }}>
                            <div>
                              <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>{s.courses?.name}</p>
                              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{s.start_time} – {s.end_time} · {s.classes?.class_name}</p>
                            </div>
                            <button onClick={() => handleDelete(s.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1rem', padding: 0 }}>✕</button>
                          </div>
                        ))}
                      </div>
                  }
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
