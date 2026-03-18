'use client'

import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

interface Props {
  assignmentId: string
  studentId: string
  alreadySubmitted: boolean
}

export function StudentSubmitForm({ assignmentId, studentId, alreadySubmitted }: Props) {
  const [submitting, setSubmitting] = useState(false)
  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [submitted, setSubmitted] = useState(alreadySubmitted)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text && !file) { toast.error('Add a note or attach a file'); return }
    setSubmitting(true)

    const supabase = createClient()
    let fileUrl: string | null = null

    if (file) {
      const path = `submissions/${assignmentId}/${studentId}/${Date.now()}_${file.name}`
      const { data, error } = await supabase.storage.from('uploads').upload(path, file)
      if (error) { toast.error('File upload failed: ' + error.message); setSubmitting(false); return }
      const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(path)
      fileUrl = urlData.publicUrl
    }

    const { error } = await supabase.from('submissions').insert({
      assignment_id: assignmentId,
      student_id: studentId,
      file_url: fileUrl,
      notes: text,
      status: 'submitted',
      submitted_at: new Date().toISOString(),
    })

    setSubmitting(false)
    if (error) { toast.error('Submission failed: ' + error.message); return }
    toast.success('Assignment submitted successfully!')
    setSubmitted(true)
    setText('')
    setFile(null)
  }

  if (submitted) {
    return (
      <div style={{ padding: '8px 12px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8, fontSize: '0.8125rem', color: '#22c55e', fontWeight: 600, marginTop: 8 }}>
        ✓ Submitted
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <textarea value={text} onChange={e => setText(e.target.value)} rows={2}
        placeholder="Write your answer or notes here…"
        style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.8125rem', resize: 'vertical', boxSizing: 'border-box' }} />
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button type="button" onClick={() => fileRef.current?.click()}
          style={{ padding: '7px 12px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 7, color: 'var(--text-secondary)', fontSize: '0.8125rem', cursor: 'pointer', flexShrink: 0 }}>
          📎 {file ? file.name.slice(0, 20) + (file.name.length > 20 ? '…' : '') : 'Attach File'}
        </button>
        <input ref={fileRef} type="file" style={{ display: 'none' }}
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip"
          onChange={e => setFile(e.target.files?.[0] || null)} />
        <button type="submit" disabled={submitting}
          style={{ flex: 1, padding: '7px 14px', background: submitting ? '#666' : 'linear-gradient(135deg,#22c55e,#16a34a)', color: '#fff', border: 'none', borderRadius: 7, fontWeight: 700, fontSize: '0.8125rem', cursor: submitting ? 'not-allowed' : 'pointer' }}>
          {submitting ? 'Submitting…' : '✓ Submit Assignment'}
        </button>
      </div>
    </form>
  )
}
