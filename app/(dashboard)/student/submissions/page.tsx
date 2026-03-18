'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { FileText, Upload, Clock, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Input'
import { SectionCard } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { Loading } from '@/components/ui/Loading'
import { Modal } from '@/components/ui/Modal'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { storageService } from '@/lib/services/storage.service'

export default function StudentSubmissionsPage() {
  const { user } = useAuth()
  const params = useSearchParams()
  const preselectedAssignment = params.get('assignmentId')
  const [submissions, setSubmissions] = useState<any[]>([])
  const [studentId, setStudentId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(!!preselectedAssignment)
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null)
  const [content, setContent] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const fetchData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const supabase = createClient()
    const { data: stu } = await supabase.from('students').select('id').eq('user_id', user.id).single()
    if (stu) {
      setStudentId(stu.id)
      const { data } = await supabase
        .from('submissions')
        .select('id, status, grade, feedback, submitted_at, file_url, content, assignment_id, assignments(title, due_date, max_score, courses(name))')
        .eq('student_id', stu.id)
        .order('submitted_at', { ascending: false })
      setSubmissions(data || [])
    }

    // Load preselected assignment
    if (preselectedAssignment) {
      const { data: asg } = await supabase.from('assignments').select('id, title, description, due_date, max_score').eq('id', preselectedAssignment).single()
      if (asg) setSelectedAssignment(asg)
    }
    setLoading(false)
  }, [user, preselectedAssignment])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSubmit = async () => {
    if (!selectedAssignment || !studentId || !user) return
    if (!content && !file) { toast.error('Please add content or upload a file'); return }
    try {
      setSubmitting(true)
      let fileUrl = null
      if (file) {
        fileUrl = await storageService.uploadSubmissionFile(user.id, selectedAssignment.id, file)
      }
      const supabase = createClient()
      const now = new Date()
      const isLate = new Date(selectedAssignment.due_date) < now
      const { error } = await supabase.from('submissions').insert({
        assignment_id: selectedAssignment.id,
        student_id: studentId,
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

  if (loading) return <Loading text="Loading submissions..." />

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1>My Submissions</h1>
        <p>Track your submitted assignments and grades</p>
      </div>

      {submissions.length === 0 ? (
        <div className="empty-state glass-card p-16">
          <div className="empty-state-icon"><FileText size={28} /></div>
          <h3>No submissions yet</h3>
          <p>Go to My Classes to submit your first assignment</p>
        </div>
      ) : (
        <SectionCard title={`Submissions (${submissions.length})`}>
          <div className="space-y-3">
            {submissions.map(s => {
              const asg = s.assignments as any
              return (
                <div key={s.id} className="p-4 rounded-xl" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{asg?.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{asg?.courses?.name}</p>
                      <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                        <Clock size={10} />
                        Submitted {formatDistanceToNow(new Date(s.submitted_at), { addSuffix: true })}
                      </p>
                      {s.feedback && (
                        <div className="mt-2 p-2.5 rounded-lg text-xs" style={{ background: 'rgba(79,142,247,0.1)', color: 'var(--text-secondary)', border: '1px solid rgba(79,142,247,0.2)' }}>
                          <strong>Feedback:</strong> {s.feedback}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <StatusBadge status={s.status} />
                      {s.grade != null ? (
                        <div className="text-right">
                          <p className="text-lg font-bold" style={{ color: 'var(--accent-green)' }}>{s.grade}/{asg?.max_score}</p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {Math.round((s.grade / (asg?.max_score || 100)) * 100)}%
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Awaiting grade</p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </SectionCard>
      )}

      {/* Submit modal */}
      <Modal isOpen={showModal && !!selectedAssignment} onClose={() => setShowModal(false)}
        title={`Submit: ${selectedAssignment?.title}`} size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="gradient" loading={submitting} leftIcon={<Upload size={15} />} onClick={handleSubmit}>Submit</Button>
          </>
        }>
        {selectedAssignment && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg text-xs" style={{ background: 'var(--bg-hover)' }}>
              <p style={{ color: 'var(--text-muted)' }}>Due: <strong style={{ color: new Date(selectedAssignment.due_date) < new Date() ? 'var(--accent-red)' : 'var(--text-primary)' }}>
                {new Date(selectedAssignment.due_date).toLocaleString()}
              </strong></p>
              {selectedAssignment.description && <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>{selectedAssignment.description}</p>}
            </div>
            <Textarea
              label="Your Answer / Notes"
              placeholder="Write your response here..."
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={5}
            />
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Attach File (PDF, DOCX — max 10MB)
              </label>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt,.png,.jpg"
                onChange={e => setFile(e.target.files?.[0] || null)}
                className="form-input text-sm"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
