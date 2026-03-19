'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/lib/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { SectionCard } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { Input, Textarea } from '@/components/ui/Input'
import { SkeletonRow } from '@/components/ui/Loading'
import { formatDistanceToNow } from 'date-fns'
import { FileText, Plus, Trash2, Users, CheckCircle, ChevronRight, FileCheck, ArrowLeft } from 'lucide-react'

interface Assignment {
  id: string; title: string; description: string; due_date: string; max_score: number
  file_url: string | null; class_id: string; created_at: string
  classes?: { class_name: string; courses?: { name: string } }
}

interface Submission {
  id: string; status: string; score: number | null; feedback: string | null
  submitted_at: string; file_url: string | null; student_id: string
  users?: { full_name: string }
}

export default function TeacherAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [myClasses, setMyClasses]     = useState<{ id: string; class_name: string; section?: string; courses?: { name: string } }[]>([])
  const [activeTab, setActiveTab]     = useState<'list' | 'submissions'>('list')
  const [selected, setSelected]       = useState<Assignment | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading]         = useState(true)
  const [saving, setSaving]           = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [deleteId, setDeleteId]       = useState<string | null>(null)
  const [gradeModal, setGradeModal]   = useState<Submission | null>(null)
  
  const [form, setForm] = useState({ title: '', description: '', due_date: '', max_score: '100', class_id: '' })
  const [gradeForm, setGradeForm] = useState({ score: '', feedback: '' })

  const { user, loading: authLoading } = useAuth()
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    if (authLoading) return
    if (!user) { setLoading(false); return }
    setLoading(true)

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
    setShowCreateModal(false)
    fetchData()
  }

  const handleDelete = async () => {
    if (!deleteId) return
    const res = await fetch(`/api/assignments?id=${deleteId}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Deleted'); fetchData() }
    else toast.error('Failed to delete')
    setDeleteId(null)
  }

  const openSubmissions = async (assignment: Assignment) => {
    setSelected(assignment)
    setActiveTab('submissions')
    setLoading(true)
    if (authLoading || !user) { setLoading(false); return } // Guard against auth loading or no user
    const { data } = await supabase
      .from('submissions')
      .select('id, status, score, feedback, submitted_at, file_url, student_id, users!submissions_student_id_fkey(full_name)')
      .eq('assignment_id', assignment.id)
      .order('submitted_at', { ascending: false })
    setSubmissions((data || []) as any[])
    setLoading(false)
  }

  const openGradeModal = (sub: Submission) => {
    setGradeModal(sub)
    setGradeForm({
      score: sub.score !== null ? String(sub.score) : '',
      feedback: sub.feedback || ''
    })
  }

  const submitGrade = async () => {
    if (!gradeModal) return
    setSaving(true)
    const res = await fetch('/api/assignments/grade', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        submissionId: gradeModal.id,
        score: gradeForm.score ? Number(gradeForm.score) : null,
        feedback: gradeForm.feedback
      })
    })
    setSaving(false)
    if (!res.ok) { toast.error('Failed to save grade'); return }
    toast.success('Grade saved')
    setGradeModal(null)
    openSubmissions(selected!)
  }

  if (activeTab === 'submissions' && selected) {
    const gradedCount = submissions.filter(s => s.status === 'graded').length
    
    return (
      <div className="space-y-6">
        <div className="page-header">
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 6 }}>
            <button onClick={() => { setActiveTab('list'); setSelected(null) }} style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer', padding: 0 }}>
              <ArrowLeft size={12} /> Back to Assignments
            </button>
          </p>
          <h1>{selected.title}</h1>
          <p>
            {(selected.classes as any)?.class_name} · Due: {new Date(selected.due_date).toLocaleDateString()} · Max Score: {selected.max_score}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, maxWidth: 400 }}>
          <div className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: `rgba(139, 92, 246, 0.1)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-purple)', flexShrink: 0 }}><Users size={16} /></div>
            <div>
              <p style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>{submissions.length}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>Submissions</p>
            </div>
          </div>
          <div className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: `rgba(16, 185, 129, 0.1)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-green)', flexShrink: 0 }}><CheckCircle size={16} /></div>
            <div>
              <p style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>{gradedCount}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>Graded</p>
            </div>
          </div>
        </div>

        <SectionCard title="Student Submissions" icon={<FileCheck size={15} style={{ color: 'var(--accent-blue)' }} />} scrollable>
          {loading ? (
            <table className="data-table"><tbody>{[...Array(3)].map((_, i) => <SkeletonRow key={i} />)}</tbody></table>
          ) : submissions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <FileText size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p>No submissions yet.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th><th>Status</th><th>Score</th><th>Submitted</th><th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map(sub => (
                  <tr key={sub.id}>
                    <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{sub.users?.full_name}</td>
                    <td>
                      <span style={{
                        padding: '4px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600,
                        background: sub.status === 'graded' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                        color: sub.status === 'graded' ? 'var(--accent-green)' : 'var(--accent-orange)'
                      }}>
                        {sub.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {sub.score !== null ? `${sub.score} / ${selected.max_score}` : '—'}
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      {formatDistanceToNow(new Date(sub.submitted_at), { addSuffix: true })}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        {sub.file_url && (
                          <a href={sub.file_url} target="_blank" rel="noreferrer">
                            <Button variant="secondary" size="sm">View File</Button>
                          </a>
                        )}
                        <Button variant="primary" size="sm" onClick={() => openGradeModal(sub)}>
                          {sub.status === 'graded' ? 'Edit Grade' : 'Grade'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </SectionCard>

        {/* Grade Modal */}
        <Modal isOpen={!!gradeModal} onClose={() => setGradeModal(null)} title="Grade Submission"
               footer={<><Button variant="secondary" onClick={() => setGradeModal(null)}>Cancel</Button><Button variant="primary" loading={saving} onClick={submitGrade}>Save Grade</Button></>}>
          <div className="space-y-4">
            <div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 4 }}>Student</p>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{gradeModal?.users?.full_name}</p>
            </div>
            <Input label={`Score (out of ${selected.max_score})`} type="number" 
                   value={gradeForm.score} onChange={e => setGradeForm(p => ({ ...p, score: e.target.value }))} />
            <Textarea label="Feedback Comments" rows={3} 
                      value={gradeForm.feedback} onChange={e => setGradeForm(p => ({ ...p, feedback: e.target.value }))} />
          </div>
        </Modal>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1>Assignments</h1>
          <p>Create assignments and grade student submissions</p>
        </div>
        <Button variant="gradient" leftIcon={<Plus size={15} />} onClick={() => setShowCreateModal(true)}>
          New Assignment
        </Button>
      </div>

      <SectionCard title={`All Assignments (${assignments.length})`} icon={<FileText size={15} style={{ color: 'var(--accent-blue)' }} />} scrollable>
        {loading ? (
          <table className="data-table"><tbody>{[...Array(4)].map((_, i) => <SkeletonRow key={i} />)}</tbody></table>
        ) : assignments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            <FileText size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <p>No assignments created yet.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Title</th><th>Class</th><th>Due Date</th><th>Max Score</th><th style={{ textAlign: 'right' }}>Actions</th></tr>
            </thead>
            <tbody>
              {assignments.map(a => {
                const isOverdue = new Date(a.due_date) < new Date()
                return (
                  <tr key={a.id}>
                    <td>
                      <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{a.title}</p>
                      {a.description && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.description}</p>}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                      {(a.classes as any)?.class_name}
                      {(a.classes as any)?.courses?.name && <span> · {(a.classes as any).courses.name}</span>}
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8125rem', color: isOverdue ? 'var(--accent-red)' : 'var(--text-secondary)', fontWeight: isOverdue ? 600 : 400 }}>
                        {new Date(a.due_date).toLocaleString()}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{a.max_score}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <Button variant="secondary" size="sm" onClick={() => openSubmissions(a)}>
                          Submissions
                        </Button>
                        <Button variant="ghost" size="sm" leftIcon={<Trash2 size={13} />} style={{ color: 'var(--accent-red)' }} onClick={() => setDeleteId(a.id)}>
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </SectionCard>

      {/* Create Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Assignment" size="md"
             footer={<><Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button><Button variant="gradient" loading={saving} onClick={handleCreate}>Create Assignment</Button></>}>
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Title *" placeholder="e.g. Midterm Essay" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
          <Textarea label="Instructions" placeholder="Describe what students need to do..." rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          <div>
            <label className="form-label">Class *</label>
            <select className="form-input" value={form.class_id} onChange={e => setForm(p => ({ ...p, class_id: e.target.value }))} required>
              <option value="">Select class…</option>
              {myClasses.map(c => <option key={c.id} value={c.id}>{c.class_name}{c.section ? ` (${c.section})` : ''} — {(c.courses as any)?.name}</option>)}
            </select>
            {myClasses.length === 0 && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>No classes assigned to you.</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Due Date & Time *" type="datetime-local" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} required />
            <Input label="Max Score" type="number" min="0" value={form.max_score} onChange={e => setForm(p => ({ ...p, max_score: e.target.value }))} required />
          </div>
        </form>
      </Modal>

      <ConfirmModal isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Assignment" message="Are you sure you want to delete this assignment? All student submissions will also be deleted." confirmLabel="Delete" confirmVariant="danger" />
    </div>
  )
}
