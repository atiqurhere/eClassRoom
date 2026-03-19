'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

interface Material {
  id: string
  title: string
  file_url: string
  file_type: string
  class_id: string
  created_at: string
  classes?: { class_name: string; courses?: { name: string } }
}

export default function TeacherMaterialsPage() {
  const [materials, setMaterials]     = useState<Material[]>([])
  const [myClasses, setMyClasses]     = useState<{ id: string; class_name: string; section?: string; courses?: { name: string } }[]>([])
  const [loading, setLoading]         = useState(true)
  const [form, setForm]               = useState({ title: '', class_id: '' })
  const [file, setFile]               = useState<File | null>(null)
  const [uploading, setUploading]     = useState(false)
  const [filterClass, setFilterClass] = useState('')
  const fileRef                       = useRef<HTMLInputElement>(null)
  const supabase                      = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const [matRes, cRes] = await Promise.all([
      fetch('/api/materials').then(r => r.json()),
      supabase.from('classes').select('id, class_name, section, courses(name)').eq('teacher_id', user!.id).order('class_name'),
    ])
    setMaterials(matRes.materials || [])
    setMyClasses((cRes.data || []) as any[])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.class_id || !file) { toast.error('Fill all fields and select a file'); return }
    setUploading(true)
    const path = `materials/${form.class_id}/${Date.now()}_${file.name}`
    const { error: uploadErr } = await supabase.storage.from('materials').upload(path, file)
    if (uploadErr) { toast.error('Upload failed: ' + uploadErr.message); setUploading(false); return }
    const { data: urlData } = supabase.storage.from('materials').getPublicUrl(path)
    const ext = file.name.split('.').pop()?.toLowerCase() || 'file'
    const res = await fetch('/api/materials', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: form.title, file_url: urlData.publicUrl, file_type: ext, class_id: form.class_id }),
    })
    const json = await res.json()
    setUploading(false)
    if (!res.ok) { toast.error(json.error || 'Failed to save'); return }
    toast.success('Material uploaded!')
    setForm({ title: '', class_id: '' })
    setFile(null)
    fetchData()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this material?')) return
    const res = await fetch(`/api/materials?id=${id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Deleted'); fetchData() }
    else toast.error('Failed to delete')
  }

  const filtered = materials.filter(m => !filterClass || m.class_id === filterClass)
  const card = 'var(--bg-card)'
  const bdr  = '1px solid var(--border)'
  const inp  = { width: '100%', padding: '9px 12px', background: 'var(--bg-hover)', border: bdr, borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.875rem', boxSizing: 'border-box' as const }

  const fileIcon = (ft: string) => ft === 'pdf' ? '📄' : ft === 'pptx' || ft === 'ppt' ? '📊' : ft === 'docx' || ft === 'doc' ? '📝' : '📎'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>📂 Learning Materials</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: '0.875rem' }}>Upload PDFs and slides for your students per class</p>
      </div>

      <div className="dash-grid-sidebar">
        {/* Upload Form */}
        <div style={{ background: card, border: bdr, borderRadius: 14, padding: 20 }}>
          <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>⬆️ Upload Material</p>
          <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Class *</label>
              <select value={form.class_id} onChange={e => setForm(p => ({ ...p, class_id: e.target.value }))} required style={inp}>
                <option value="">Select class…</option>
                {myClasses.map(c => <option key={c.id} value={c.id}>{c.class_name}{c.section ? ` (${c.section})` : ''} — {(c.courses as any)?.name}</option>)}
              </select>
              {myClasses.length === 0 && <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 6 }}>No classes assigned to you yet.</p>}
            </div>
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Title *</label>
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required placeholder="e.g. Chapter 4 Notes" style={inp} />
            </div>
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>File * (PDF, PPT, DOCX)</label>
              <button type="button" onClick={() => fileRef.current?.click()}
                style={{ ...inp, textAlign: 'left' as const, cursor: 'pointer', color: file ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                {file ? `📄 ${file.name}` : '📎 Choose file…'}
              </button>
              <input ref={fileRef} type="file" accept=".pdf,.ppt,.pptx,.doc,.docx,.txt,.zip" style={{ display: 'none' }} onChange={e => setFile(e.target.files?.[0] || null)} />
            </div>
            <button type="submit" disabled={uploading}
              style={{ padding: '10px', background: uploading ? '#666' : 'linear-gradient(135deg,#4f8ef7,#8b5cf6)', color: '#fff', border: 'none', borderRadius: 9, fontWeight: 700, cursor: uploading ? 'not-allowed' : 'pointer', marginTop: 4 }}>
              {uploading ? '⏳ Uploading…' : '⬆️ Upload'}
            </button>
          </form>
        </div>

        {/* Materials List */}
        <div style={{ background: card, border: bdr, borderRadius: 14, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <p style={{ fontWeight: 700, color: 'var(--text-primary)' }}>📚 Uploaded Materials ({filtered.length})</p>
            <select value={filterClass} onChange={e => setFilterClass(e.target.value)}
              style={{ padding: '6px 10px', background: 'var(--bg-hover)', border: bdr, borderRadius: 7, color: 'var(--text-primary)', fontSize: '0.8125rem' }}>
              <option value="">All classes</option>
              {myClasses.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
            </select>
          </div>
          {loading ? <p style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>Loading…</p>
          : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 0' }}>
              <p style={{ fontSize: '2rem', marginBottom: 8 }}>📂</p>
              <p style={{ color: 'var(--text-muted)' }}>No materials uploaded yet</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filtered.map(m => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', background: 'var(--bg-hover)', borderRadius: 10 }}>
                  <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{fileIcon(m.file_type)}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{m.title}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      {(m.classes as any)?.class_name} · {(m.classes as any)?.courses?.name} · {m.file_type?.toUpperCase()} · {new Date(m.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <a href={m.file_url} target="_blank" rel="noopener noreferrer"
                      style={{ padding: '5px 12px', background: '#4f8ef718', color: '#4f8ef7', borderRadius: 7, fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none', border: '1px solid #4f8ef730' }}>View</a>
                    <button onClick={() => handleDelete(m.id)}
                      style={{ padding: '5px 12px', background: '#ef444418', color: '#ef4444', border: '1px solid #ef444430', borderRadius: 7, fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
