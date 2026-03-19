'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { SectionCard } from '@/components/ui/Card'

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
    const name  = s.users?.full_name?.toLowerCase() || ''
    const email = s.users?.email?.toLowerCase() || ''
    const id    = s.student_id?.toLowerCase() || ''
    return name.includes(search.toLowerCase()) || email.includes(search.toLowerCase()) || id.includes(search.toLowerCase())
  })

  return (
    <div className="space-y-5">
      <div className="page-header">
        <h1>🎓 Assign Students to Classes</h1>
        <p>Manage class assignments for each student</p>
      </div>

      <SectionCard
        title={`Students (${filtered.length})`}
        scrollable
        action={
          <input
            type="text"
            placeholder="Search by name, email, ID…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="form-input"
            style={{ maxWidth: 240, width: '100%', padding: '7px 12px', fontSize: '0.8125rem' }}
          />
        }
      >
        {loading ? (
          <p style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>Loading…</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Student ID</th>
                <th>Email</th>
                <th>Assigned Class</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>No students yet</td></tr>
              ) : (
                filtered.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.users?.full_name || 'Unknown'}</td>
                    <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{s.student_id || '—'}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{s.users?.email || '—'}</td>
                    <td>
                      <select
                        defaultValue={s.class_id || ''}
                        onChange={e => assignClass(s.id, e.target.value)}
                        disabled={saving === s.id}
                        className="form-select"
                        style={{ padding: '6px 10px', fontSize: '0.8125rem', width: '100%', maxWidth: 200 }}
                      >
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
          </table>
        )}
      </SectionCard>
    </div>
  )
}
