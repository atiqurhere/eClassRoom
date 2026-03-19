'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { FileText, Upload, Clock, CheckCircle, Send } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Input'
import { SectionCard } from '@/components/ui/Card'
import { SkeletonRow } from '@/components/ui/Loading'
import { Modal } from '@/components/ui/Modal'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { storageService } from '@/lib/services/storage.service'

export default function StudentSubmissionsPage() {
  const { user, loading: authLoading } = useAuth()
  const params = useSearchParams()
  const preselectedAssignment = params.get('assignmentId')
  const [submissions, setSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(!!preselectedAssignment)
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null)
  const [content, setContent] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const fetchData = useCallback(async () => {
    if (authLoading) return
    if (!user) { setLoading(false); return }
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('submissions')
      .select('id, status, score, feedback, submitted_at, file_url, content, assignment_id, assignments(title, due_date, max_score, classes(class_name, courses(name)))')
      .eq('student_id', user.id)
      .order('submitted_at', { ascending: false })
    setSubmissions(data || [])

    if (preselectedAssignment) {
      const { data: asg } = await supabase.from('assignments').select('id, title, description, due_date, max_score').eq('id', preselectedAssignment).single()
      if (asg) setSelectedAssignment(asg)
    }
    setLoading(false)
  }, [user, preselectedAssignment])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSubmit = async () => {
    if (!selectedAssignment || !user) return
    if (!content && !file) { toast.error('Please add content or upload a file'); return }
    try {
      setSubmitting(true)
      let fileUrl = null
      if (file) fileUrl = await storageService.uploadSubmissionFile(user.id, selectedAssignment.id, file)
      const supabase = createClient()
      const now = new Date()
      const isLate = new Date(selectedAssignment.due_date) < now
      const { error } = await supabase.from('submissions').insert({
        assignment_id: selectedAssignment.id,
        student_id: user.id,
        content: content || null,
        file_url: fileUrl,
        status: isLate ? 'late' : 'submitted',
        submitted_at: now.toISOString(),
      })
      if (error) throw error
      toast.success(isLate ? 'Submitted (late)' : 'Submitted successfully!')
      setShowModal(false)
      setContent('')
      setFile(null)
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  const gradedCount   = submissions.filter(s => s.status === 'graded').length
  const pendingCount  = submissions.filter(s => s.status === 'submitted').length

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1>My Submissions</h1>
        <p>Track your submitted assignments and grades</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {[
          { label: 'Total',   value: submissions.length, color: 'var(--accent-blue)',   bg: 'rgba(79,142,247,0.1)',  icon: <Send size={16} /> },
          { label: 'Graded',  value: gradedCount,        color: 'var(--accent-green)',  bg: 'rgba(34,197,94,0.1)',  icon: <CheckCircle size={16} /> },
          { label: 'Pending', value: pendingCount,       color: 'var(--accent-orange)', bg: 'rgba(245,158,11,0.1)', icon: <Clock size={16} /> },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.icon}</div>
            <div>
              <p style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{s.value}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 3 }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <SectionCard title={`Submissions (${submissions.length})`} icon={<FileText size={15} style={{ color: 'var(--accent-blue)' }} />} scrollable>
        {loading ? (
          <table className="data-table"><tbody>{[...Array(4)].map((_, i) => <SkeletonRow key={i} />)}</tbody></table>
        ) : submissions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            <FileText size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <p>No submissions yet. Go to <b>My Classes</b> to submit your first assignment.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Assignment</th><th>Class</th><th>Submitted</th><th>Score</th><th style={{textAlign:'right'}}>Status</th></tr>
            </thead>
            <tbody>
              {submissions.map(s => {
                const asg = s.assignments as any
                return (
                  <tr key={s.id}>
                    <td>
                      <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{asg?.title}</p>
                      {s.feedback && (
                        <div style={{ marginTop: 6, padding: '6px 10px', borderRadius: 6, fontSize: '0.75rem', background: 'rgba(79,142,247,0.08)', color: 'var(--text-secondary)', border: '1px solid rgba(79,142,247,0.15)' }}>
                          <b>Feedback:</b> {s.feedback}
                        </div>
                      )}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                      {(asg?.classes as any)?.class_name}
                      {(asg?.classes as any)?.courses?.name && <span style={{ display: 'block', fontSize: '0.75rem' }}>{(asg.classes as any).courses.name}</span>}
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={11} /> {formatDistanceToNow(new Date(s.submitted_at), { addSuffix: true })}
                      </div>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                      {s.score != null ? `${s.score} / ${asg?.max_score}` : '—'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'flex-end' }}>
                        {s.file_url && (
                          <a href={`/material-viewer?url=${encodeURIComponent(s.file_url)}&title=${encodeURIComponent(asg?.title + ' (My Submission)')}`} target="_blank" rel="noreferrer">
                            <Button variant="ghost" size="sm" style={{ padding: '0 8px', height: 26, fontSize: '0.75rem', background: 'rgba(79,142,247,0.08)', color: 'var(--accent-blue)' }}>View File</Button>
                          </a>
                        )}
                        <span style={{
                          padding: '4px 10px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700, textTransform: 'capitalize',
                          background: s.status === 'graded' ? 'rgba(34,197,94,0.12)' : s.status === 'late' ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)',
                          color: s.status === 'graded' ? 'var(--accent-green)' : s.status === 'late' ? 'var(--accent-red)' : 'var(--accent-orange)',
                        }}>
                          {s.status}
                        </span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </SectionCard>

      {/* Submit modal (pre-opened if coming from assignments page) */}
      <Modal isOpen={showModal && !!selectedAssignment} onClose={() => setShowModal(false)}
        title={`Submit: ${selectedAssignment?.title}`} size="md"
        footer={<><Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button><Button variant="gradient" loading={submitting} leftIcon={<Upload size={15} />} onClick={handleSubmit}>Submit</Button></>}>
        {selectedAssignment && (
          <div className="space-y-4">
            <div style={{ padding: '12px', borderRadius: 10, background: 'var(--bg-hover)' }}>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Due: <strong style={{ color: new Date(selectedAssignment.due_date) < new Date() ? 'var(--accent-red)' : 'var(--text-primary)' }}>
                  {new Date(selectedAssignment.due_date).toLocaleString()}
                </strong>
              </p>
              {selectedAssignment.description && <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: 6 }}>{selectedAssignment.description}</p>}
            </div>
            <Textarea label="Your Answer / Notes" placeholder="Write your response here..." value={content} onChange={e => setContent(e.target.value)} rows={5} />
            <div>
              <label className="form-label">Attach File (PDF, DOCX — max 10MB)</label>
              <input type="file" accept=".pdf,.doc,.docx,.txt,.png,.jpg" onChange={e => setFile(e.target.files?.[0] || null)} className="form-input text-sm" />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
