'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Star, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'

interface GradingModalProps {
  isOpen: boolean
  onClose: () => void
  submission: {
    id: string
    student_name: string
    assignment_title: string
    content?: string
    file_url?: string
    max_score: number
  } | null
  onGraded: () => void
}

export function GradingModal({ isOpen, onClose, submission, onGraded }: GradingModalProps) {
  const [score, setScore] = useState('')
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading] = useState(false)

  const handleGrade = async () => {
    if (!submission) return
    const numScore = Number(score)
    if (isNaN(numScore) || numScore < 0 || numScore > submission.max_score) {
      toast.error(`Score must be between 0 and ${submission.max_score}`)
      return
    }
    try {
      setLoading(true)
      const res = await fetch(`/api/submissions/${submission.id}/grade`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score: numScore, feedback }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Submission graded successfully')
      setScore('')
      setFeedback('')
      onGraded()
      onClose()
    } catch (err: any) {
      toast.error(err.message || 'Failed to grade submission')
    } finally {
      setLoading(false)
    }
  }

  const pct = score && submission ? Math.round((Number(score) / submission.max_score) * 100) : 0
  const gradeColor = pct >= 80 ? 'var(--accent-green)' : pct >= 60 ? 'var(--accent-orange)' : 'var(--accent-red)'

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Grade Submission"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="gradient" loading={loading} onClick={handleGrade}>
            Submit Grade
          </Button>
        </>
      }
    >
      {submission && (
        <div className="space-y-5">
          {/* Info */}
          <div className="p-4 rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Assignment</p>
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{submission.assignment_title}</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Student: {submission.student_name}</p>
          </div>

          {/* Submission content */}
          {submission.content && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                Submitted Answer
              </p>
              <div className="p-3 rounded-lg text-sm leading-relaxed" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border)', maxHeight: 160, overflowY: 'auto' }}>
                {submission.content}
              </div>
            </div>
          )}

          {/* File */}
          {submission.file_url && (
            <a href={submission.file_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm font-medium"
              style={{ color: 'var(--accent-blue)' }}>
              📎 View Attached File
            </a>
          )}

          {/* Score */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              <Star size={14} className="inline mr-1" />
              Score <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(out of {submission.max_score})</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={0}
                max={submission.max_score}
                value={score}
                onChange={e => setScore(e.target.value)}
                className="form-input"
                style={{ width: 110 }}
                placeholder={`0–${submission.max_score}`}
              />
              {score !== '' && (
                <div>
                  <span className="text-lg font-bold" style={{ color: gradeColor }}>{pct}%</span>
                  <div className="progress-bar mt-1" style={{ width: 120 }}>
                    <div className="progress-fill" style={{ width: `${pct}%`, background: gradeColor }} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Feedback */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              <MessageSquare size={14} className="inline mr-1" />
              Feedback <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
            </label>
            <textarea
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              className="form-input"
              rows={3}
              placeholder="Leave feedback for the student..."
              style={{ resize: 'vertical' }}
            />
          </div>
        </div>
      )}
    </Modal>
  )
}
