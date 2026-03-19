'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

export default function AdminAssignStudentsPage() {
  const [students, setStudents] = useState<any[]>([])
  const [classes, setClasses]   = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState<string | null>(null)
  const [search, setSearch]     = useState('')
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [stuRes, clsRes] = await Promise.all([
      supabase.from('students').select('id, student_id, class_id, user_id, users(full_name, email)').order('id'),
      supabase.from('classes').select('id, class_name, section').order('class_name'),
    ])
    setStudents((stuRes.data || []) as any[])
    setClasses((clsRes.data || []) as any[])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const assignClass = async (studentId: string, classId: string) => {
    setSaving(studentId)
    const { error } = await supabase
      .from('students')
      .update({ class_id: classId || null })
      .eq('id', studentId)
    setSaving(null)
    if (error) toast.error(error.message)
    else toast.success('Class assigned')
  }

  const filtered = students.filter(s => {
    if (!search) return true
    const name = s.users?.full_name?.toLowerCase() || ''
    const email = s.users?.email?.toLowerCase() || ''
    const id = s.student_id?.toLowerCase() || ''
    return name.includes(search.toLowerCase()) || email.includes(search.toLowerCase()) || id.includes(search.toLowerCase())
  })

  const card = 'var(--bg-card)'
  const bdr  = '1px solid var(--border)'
  const sel  = { padding: '6px 10px', background: 'var(--bg-hover)', border: bdr, borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.8125rem', width: '100%', boxSizing: 'border-box' as const }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>🎓 Assign Students to Classes</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: '0.875rem' }}>Manage class assignments for each student</p>
      </div>

      <div style={{ background: card, border: bdr, borderRadius: 14, padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <p style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Students ({filtered.length})</p>
          <input type="text" placeholder="Search by name, email, ID…" value={search} onChange={e => setSearch(e.target.value)}
            style={{ padding: '7px 12px', background: 'var(--bg-hover)', border: bdr, borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.8125rem', maxWidth: 240, width: '100%' }} />
        </div>
        {loading ? <p style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>Loading…</p> : (
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', minWidth: 560 }}>
            <thead><tr style={{ borderBottom: bdr }}>
              {['Student', 'Student ID', 'Email', 'Assigned Class'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '8px', color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700 }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>No students yet</td></tr>
              ) : (
                filtered.map(s => (
                  <tr key={s.id} style={{ borderBottom: bdr }}>
                    <td style={{ padding: '10px 8px', fontWeight: 600, color: 'var(--text-primary)' }}>{s.users?.full_name || 'Unknown'}</td>
                    <td style={{ padding: '10px 8px', color: 'var(--text-muted)', fontSize: '0.8125rem', fontFamily: 'monospace' }}>{s.student_id || '—'}</td>
                    <td style={{ padding: '10px 8px', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>{s.users?.email || '—'}</td>
                    <td style={{ padding: '6px 8px' }}>
                      <select defaultValue={s.class_id || ''} onChange={e => assignClass(s.id, e.target.value)} disabled={saving === s.id} style={sel}>
                        <option value="">— Unassigned —</option>
                        {classes.map(c => (
                          <option key={c.id} value={c.id}>{c.class_name}{c.section ? ` (${c.section})` : ''}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table></div>
        )}
      </div>
    </div>
  )
}
