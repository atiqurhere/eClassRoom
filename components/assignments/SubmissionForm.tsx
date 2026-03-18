'use client'

import { useState, useRef } from 'react'
import { FileText, Upload, X, Clock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface SubmissionFormProps {
  assignmentId: string
  assignmentTitle: string
  dueDate: string
  maxScore: number
  onSuccess?: () => void
}

export function SubmissionForm({ assignmentId, assignmentTitle, dueDate, maxScore, onSuccess }: SubmissionFormProps) {
  const [loading, setLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [content, setContent] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isOverdue = new Date() > new Date(dueDate)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB')
      return
    }
    setSelectedFile(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile && !content.trim()) {
      toast.error('Please upload a file or enter a text submission')
      return
    }
    try {
      setLoading(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      let fileUrl: string | null = null

      // Upload file to Supabase Storage if provided
      if (selectedFile) {
        const ext = selectedFile.name.split('.').pop()
        const path = `submissions/${assignmentId}/${user.id}-${Date.now()}.${ext}`
        const { error: upErr } = await supabase.storage
          .from('submissions')
          .upload(path, selectedFile, { upsert: true })
        if (upErr) throw upErr
        const { data: urlData } = supabase.storage.from('submissions').getPublicUrl(path)
        fileUrl = urlData.publicUrl
      }

      // Upsert submission (in case of resubmit)
      const { error } = await supabase.from('submissions').upsert({
        assignment_id: assignmentId,
        student_id: user.id,
        content: content.trim() || null,
        file_url: fileUrl,
        submitted_at: new Date().toISOString(),
      }, { onConflict: 'assignment_id,student_id' })

      if (error) throw error

      toast.success('Assignment submitted successfully!')
      setSelectedFile(null)
      setContent('')
      if (onSuccess) onSuccess()
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit assignment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4 pt-2">
      {/* Header info */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <FileText size={14} style={{ color: 'var(--accent-blue)' }} />
            {assignmentTitle}
          </p>
          <p className="text-xs mt-0.5" style={{ color: isOverdue ? 'var(--accent-red)' : 'var(--text-muted)' }}>
            <Clock size={11} className="inline mr-1" />
            Due {new Date(dueDate).toLocaleDateString()} · Max {maxScore} pts
          </p>
        </div>
      </div>

      {isOverdue && (
        <div className="rounded-lg px-3 py-2.5" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <p className="text-sm" style={{ color: 'var(--accent-red)' }}>
            ⚠️ This assignment is overdue. Late submissions may be penalised.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* File upload drop zone */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
            Attach File
          </label>
          <div
            className="rounded-xl border-2 border-dashed p-5 text-center cursor-pointer transition-colors"
            style={{ borderColor: selectedFile ? 'var(--accent-blue)' : 'var(--border)', background: selectedFile ? 'rgba(79,142,247,0.04)' : 'var(--bg-secondary)' }}
            onClick={() => fileInputRef.current?.click()}
          >
            {selectedFile ? (
              <div className="flex items-center justify-center gap-3">
                <FileText size={20} style={{ color: 'var(--accent-blue)' }} />
                <div className="text-left">
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{selectedFile.name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); setSelectedFile(null) }}
                  className="ml-2 p-1 rounded-full"
                  style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--accent-red)' }}>
                  <X size={12} />
                </button>
              </div>
            ) : (
              <>
                <Upload size={24} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
                <p className="text-sm font-medium" style={{ color: 'var(--accent-blue)' }}>Click to upload</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>PDF, DOC, DOCX, PPT, ZIP · Max 10MB</p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.zip"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>

        {/* Text submission */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
            Text Submission <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional)</span>
          </label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            className="form-input w-full"
            rows={4}
            placeholder="Enter your answer or notes here..."
            style={{ resize: 'vertical' }}
          />
        </div>

        <Button type="submit" variant="gradient" fullWidth loading={loading}>
          Submit Assignment
        </Button>
      </form>
    </div>
  )
}