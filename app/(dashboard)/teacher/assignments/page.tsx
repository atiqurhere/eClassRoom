'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

interface Assignment {
  id: string
  title: string
  description: string
  due_date: string
  max_score: number
  file_url: string | null
  class_id: string
  created_at: string
  classes?: { class_name: string; courses?: { name: string } }
}

interface Submission {
  id: string
  status: string
  score: number | null
  feedback: string | null
  submitted_at: string
  file_url: string | null
  student_id: string
  users?: { full_name: string }
  assignment_id: string
}

export default function TeacherAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [myClasses, setMyClasses]     = useState<{ id: string; class_name: string; section?: string; courses?: { name: string } }[]>([])
  const [activeTab, setActiveTab]     = useState<'list' | 'create' | 'submissions'>('list')
  const [selected, setSelected]       = useState<Assignment | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading]         = useState(true)
  const [saving, setSaving]           = useState(false)
  const [gradingId, setGradingId]     = useState<string | null>(null)

  const [form, setForm] = useState({ title: '', description: '', due_date: '', max_score: '100', class_id: '' })

  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [aRes, cRes] = await Promise.all([
      supabase.from('assignments')
        .select('id, title, description, due_date, max_score, file_url, class_id, created_at, classes(class_name, courses(name))')
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false }),
      supabase.from('classes')
        .select('id, class_name, section, courses(name)')
        .eq('teacher_id', user.id)
        .order('class_name'),
    ])
    setAssignments((aRes.data || []) as any[])
    setMyClasses((cRes.data || []) as any[])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.due_date || !form.class_id) { toast.error('Fill all required fields'); return }
    setSaving(true)
    const res = await fetch('/api/assignments', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, max_score: Number(form.max_score) }),
    })
    const json = await res.json()
    setSaving(false)
    if (!res.ok) { toast.error(json.error || 'Failed to create'); return }
    toast.success('Assignment created! Students notified.')
    setForm({ title: '', description: '', due_date: '', max_score: '100', class_id: '' })
    setActiveTab('list')
    fetchData()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this assignment?')) return
    const res = await fetch(`/api/assignments?id=${id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Deleted'); fetchData() }
    else toast.error('Failed to delete')
  }

  const openSubmissions = async (assignment: Assignment) => {
    setSelected(assignment)
    setActiveTab('submissions')
    // Submissions joined directly to users (no students table)
    const { data } = await supabase
      .from('submissions')
      .select('id, status, score, feedback, submitted_at, file_url, student_id, users!submissions_student_id_fkey(full_name)')
      .eq('assignment_id', assignment.id)
      .order('submitted_at', { ascending: false })
    setSubmissions((data || []) as any[])
  }

  const handleGrade = async (subId: string, score: string, feedback: string) => {
    setGradingId(subId)
    const res = await fetch(`/api/submissions/${subId}/grade`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score: Number(score), feedback }),
    })
    setGradingId(null)
    if (res.ok) { toast.success('Grade saved'); openSubmissions(selected!) }
    else toast.error('Failed to save grade')
  }

  const card  = 'var(--bg-card)'
  const bdr   = '1px solid var(--border)'
  const now   = new Date()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>Assignments</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: '0.875rem' }}>Create and manage assignments per class</p>
        </div>
        <button onClick={() => setActiveTab('create')} style={{ padding: '8px 18px', background: 'linear-gradient(135deg,#4f8ef7,#8b5cf6)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
          + New Assignment
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        {(['list', 'create', selected ? 'submissions' : null] as const).filter(Boolean).map(tab => (
          <button key={tab!} onClick={() => setActiveTab(tab!)}
            style={{ padding: '7px 16px', borderRadius: 8, border: bdr, background: activeTab === tab ? '#4f8ef7' : card, color: activeTab === tab ? '#fff' : 'var(--text-secondary)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
            {tab === 'list' ? '📋 Assignments' : tab === 'create' ? '✍️ Create' : `📬 Submissions (${submissions.length})`}
          </button>
        ))}
      </div>

      {/* CREATE */}
      {activeTab === 'create' && (
        <div style={{ background: card, border: bdr, borderRadius: 14, padding: 24, maxWidth: 600 }}>
          <p style={{ fontWeight: 700, fontSize: '1.125rem', color: 'var(--text-primary)', marginBottom: 18 }}>✍️ New Assignment</p>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="form-label">Class *</label>
              <select value={form.class_id} onChange={e => setForm(p => ({ ...p, class_id: e.target.value }))} required className="form-input">
                <option value="">Select class…</option>
                {myClasses.map(c => <option key={c.id} value={c.id}>{c.class_name}{c.section ? ` (${c.section})` : ''} — {(c.courses as any)?.name}</option>)}
              </select>
              {myClasses.length === 0 && <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 6 }}>No classes assigned to you yet.</p>}
            </div>
            <div>
              <label className="form-label">Title *</label>
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required placeholder="e.g. Chapter 3 Exercise" className="form-input" />
            </div>
            <div>
              <label className="form-label">Description</label>
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} className="form-input" style={{ resize: 'vertical' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="form-label">Due Date *</label>
                <input type="datetime-local" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} required className="form-input" />
              </div>
              <div>
                <label className="form-label">Max Score</label>
                <input type="number" value={form.max_score} onChange={e => setForm(p => ({ ...p, max_score: e.target.value }))} min={1} className="form-input" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button type="submit" disabled={saving} style={{ flex: 1, padding: '10px', background: saving ? '#666' : 'linear-gradient(135deg,#4f8ef7,#8b5cf6)', color: '#fff', border: 'none', borderRadius: 9, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? 'Creating…' : '✓ Create Assignment'}
              </button>
              <button type="button" onClick={() => setActiveTab('list')} style={{ padding: '10px 18px', background: 'var(--bg-hover)', color: 'var(--text-secondary)', border: bdr, borderRadius: 9, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* LIST */}
      {activeTab === 'list' && (
        <div style={{ background: card, border: bdr, borderRadius: 14, padding: 20 }}>
          {loading ? (
            <p style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>Loading…</p>
          ) : !assignments.length ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <p style={{ fontSize: '2rem', marginBottom: 8 }}>📝</p>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>No assignments yet</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {assignments.map(a => {
                const isOverdue = new Date(a.due_date) < now
                return (
                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg-hover)', borderRadius: 10, gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9375rem' }}>{a.title}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 3 }}>
                        {(a.classes as any)?.class_name} · {(a.classes as any)?.courses?.name} · Due {new Date(a.due_date).toLocaleDateString()} {isOverdue ? '⚠️' : ''}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <button onClick={() => openSubmissions(a)} style={{ padding: '5px 12px', background: '#4f8ef718', color: '#4f8ef7', border: '1px solid #4f8ef730', borderRadius: 7, fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>Submissions</button>
                      <button onClick={() => handleDelete(a.id)} style={{ padding: '5px 12px', background: '#ef444418', color: '#ef4444', border: '1px solid #ef444430', borderRadius: 7, fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>Delete</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* SUBMISSIONS */}
      {activeTab === 'submissions' && selected && (
        <div style={{ background: card, border: bdr, borderRadius: 14, padding: 20 }}>
          <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{selected.title} — Submissions</p>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 16 }}>Max score: {selected.max_score}</p>
          {!submissions.length ? (
            <p style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>No submissions yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {submissions.map(s => (
                <SubmissionRow key={s.id} sub={s} maxScore={selected.max_score} grading={gradingId === s.id} onGrade={handleGrade} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function SubmissionRow({ sub, maxScore, grading, onGrade }: { sub: Submission; maxScore: number; grading: boolean; onGrade: (id: string, g: string, f: string) => void }) {
  const [g, setG] = useState(sub.score?.toString() || '')
  const [f, setF] = useState(sub.feedback || '')
  const bdr = '1px solid var(--border)'
  const statusColor = sub.status === 'graded' ? '#22c55e' : sub.status === 'submitted' ? '#4f8ef7' : '#f59e0b'

  return (
    <div style={{ padding: '14px 16px', background: 'var(--bg-hover)', borderRadius: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div>
          <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
            {(sub.users as any)?.full_name || 'Unknown Student'}
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
            Submitted {sub.submitted_at ? new Date(sub.submitted_at).toLocaleString() : 'N/A'}
            {sub.file_url && <> · <a href={sub.file_url} target="_blank" rel="noopener noreferrer" style={{ color: '#4f8ef7' }}>View File</a></>}
          </p>
        </div>
        <span style={{ padding: '3px 10px', borderRadius: 100, fontSize: '0.7rem', fontWeight: 700, background: `${statusColor}18`, color: statusColor, textTransform: 'capitalize' }}>{sub.status}</span>
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <input type="number" min={0} max={maxScore} value={g} onChange={e => setG(e.target.value)} placeholder={`Score /${maxScore}`}
          style={{ width: 100, padding: '7px 10px', background: 'var(--bg-card)', border: bdr, borderRadius: 7, color: 'var(--text-primary)', fontSize: '0.8125rem' }} />
        <input value={f} onChange={e => setF(e.target.value)} placeholder="Feedback (optional)"
          style={{ flex: 1, padding: '7px 10px', background: 'var(--bg-card)', border: bdr, borderRadius: 7, color: 'var(--text-primary)', fontSize: '0.8125rem' }} />
        <button onClick={() => onGrade(sub.id, g, f)} disabled={grading || !g}
          style={{ padding: '7px 14px', background: grading ? '#666' : '#22c55e', color: '#fff', border: 'none', borderRadius: 7, fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          {grading ? '…' : sub.status === 'graded' ? 'Update' : 'Grade'}
        </button>
      </div>
    </div>
  )
}
