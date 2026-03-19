'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { SectionCard } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { SkeletonRow } from '@/components/ui/Loading'
import { FileText, Upload, Trash2, ExternalLink, Search, RefreshCw, File, FileType, FileVideo } from 'lucide-react'
import Link from 'next/link'

/** Strip characters that cause Supabase Storage 400 errors (brackets, spaces, etc.) */
function sanitizeFilename(name: string): string {
  return name
    .replace(/\[|\]/g, '')               // square brackets → gone
    .replace(/[^a-zA-Z0-9._-]/g, '_')   // any other unsafe char → underscore
    .replace(/__+/g, '_')               // collapse runs of underscores
    .replace(/^_|_$/g, '')              // trim edges
}

function fileIcon(ft: string) {
  if (ft === 'pdf') return <FileText size={15} style={{ color: '#ef4444' }} />
  if (['pptx', 'ppt'].includes(ft)) return <FileType size={15} style={{ color: '#f59e0b' }} />
  if (['mp4', 'webm', 'mkv'].includes(ft)) return <FileVideo size={15} style={{ color: '#8b5cf6' }} />
  return <File size={15} style={{ color: 'var(--accent-blue)' }} />
}

interface Material {
  id: string; title: string; file_url: string; file_type: string
  class_id: string; created_at: string
  classes?: { class_name: string; section?: string; courses?: { name: string } }
}

export default function TeacherMaterialsPage() {
  const [materials, setMaterials]     = useState<Material[]>([])
  const [myClasses, setMyClasses]     = useState<{ id: string; class_name: string; section?: string; courses?: { name: string } }[]>([])
  const [loading, setLoading]         = useState(true)
  const [form, setForm]               = useState({ title: '', class_id: '' })
  const [file, setFile]               = useState<File | null>(null)
  const [uploading, setUploading]     = useState(false)
  const [filterClass, setFilterClass] = useState('')
  const [search, setSearch]           = useState('')
  const fileRef                       = useRef<HTMLInputElement>(null)
  const supabase                      = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const [matRes, cRes] = await Promise.all([
      supabase
        .from('materials')
        .select('id, title, file_url, file_type, class_id, created_at, classes(class_name, section, courses(name))')
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false }),
      supabase.from('classes').select('id, class_name, section, courses(name)').eq('teacher_id', user.id).order('class_name'),
    ])
    setMaterials((matRes.data || []) as any[])
    setMyClasses((cRes.data || []) as any[])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) { toast.error('Title is required'); return }
    if (!form.class_id)     { toast.error('Select a class'); return }
    if (!file)              { toast.error('Select a file'); return }

    setUploading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const safeName = sanitizeFilename(file.name)
    const path = `materials/${form.class_id}/${Date.now()}_${safeName}`

    const { error: uploadErr } = await supabase.storage.from('materials').upload(path, file)
    if (uploadErr) { toast.error('Upload failed: ' + uploadErr.message); setUploading(false); return }

    const { data: urlData } = supabase.storage.from('materials').getPublicUrl(path)
    const ext = file.name.split('.').pop()?.toLowerCase() || 'file'

    const { error: dbErr } = await supabase.from('materials').insert({
      title: form.title.trim(),
      file_url: urlData.publicUrl,
      file_type: ext,
      class_id: form.class_id,
      teacher_id: user!.id,
    })
    setUploading(false)
    if (dbErr) { toast.error('File saved but record failed: ' + dbErr.message); return }

    toast.success('Material uploaded!')
    setForm({ title: '', class_id: '' })
    setFile(null)
    if (fileRef.current) fileRef.current.value = ''
    fetchData()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this material?')) return
    const { error } = await supabase.from('materials').delete().eq('id', id)
    if (!error) { toast.success('Deleted'); fetchData() }
    else toast.error('Failed to delete')
  }

  const filtered = materials.filter(m => {
    const matchClass  = !filterClass || m.class_id === filterClass
    const matchSearch = !search || m.title.toLowerCase().includes(search.toLowerCase())
    return matchClass && matchSearch
  })

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1>Learning Materials</h1>
        <p>Upload PDFs, slides, and documents for your students per class</p>
      </div>

      <div className="dash-grid-sidebar" style={{ alignItems: 'start' }}>
        {/* Upload Form */}
        <SectionCard title="Upload Material" icon={<Upload size={15} style={{ color: 'var(--accent-blue)' }} />}>
          <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="form-label">Class *</label>
              <select className="form-input" value={form.class_id}
                onChange={e => setForm(p => ({ ...p, class_id: e.target.value }))} required>
                <option value="">Select class…</option>
                {myClasses.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.class_name}{c.section ? ` (${c.section})` : ''}{(c.courses as any)?.name ? ` — ${(c.courses as any).name}` : ''}
                  </option>
                ))}
              </select>
              {!loading && myClasses.length === 0 && (
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 6 }}>No classes assigned to you yet.</p>
              )}
            </div>

            <div>
              <label className="form-label">Title *</label>
              <input className="form-input" value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="e.g. Chapter 4 Notes" required />
            </div>

            <div>
              <label className="form-label">File * (PDF, PPT, DOCX, MP4…)</label>
              <button type="button" onClick={() => fileRef.current?.click()}
                className="form-input"
                style={{ textAlign: 'left', cursor: 'pointer', color: file ? 'var(--text-primary)' : 'var(--text-muted)', width: '100%' }}>
                {file ? `📄 ${file.name}` : '📎 Choose file…'}
              </button>
              <input ref={fileRef} type="file"
                accept=".pdf,.ppt,.pptx,.doc,.docx,.txt,.zip,.mp4,.webm,.mkv"
                style={{ display: 'none' }}
                onChange={e => setFile(e.target.files?.[0] || null)} />
            </div>

            <Button type="submit" variant="gradient" loading={uploading} leftIcon={<Upload size={15} />}>
              {uploading ? 'Uploading…' : 'Upload Material'}
            </Button>
          </form>
        </SectionCard>

        {/* Materials List */}
        <SectionCard
          title={`Uploaded Materials (${filtered.length})`}
          icon={<FileText size={15} style={{ color: 'var(--accent-purple)' }} />}
          action={
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input type="text" placeholder="Search…" value={search}
                  onChange={e => setSearch(e.target.value)} className="form-input"
                  style={{ width: 130, padding: '6px 10px 6px 28px', fontSize: '0.8125rem' }} />
              </div>
              <select value={filterClass} onChange={e => setFilterClass(e.target.value)}
                className="form-input" style={{ padding: '6px 28px 6px 10px', fontSize: '0.8125rem', width: 130 }}>
                <option value="">All classes</option>
                {myClasses.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
              </select>
              <Button variant="ghost" size="sm" leftIcon={<RefreshCw size={12} />} onClick={fetchData} />
            </div>
          }
          scrollable
        >
          {loading ? (
            <table className="data-table"><tbody>{[...Array(3)].map((_, i) => <SkeletonRow key={i} />)}</tbody></table>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--text-muted)' }}>
              <FileText size={28} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
              <p>{search || filterClass ? 'No materials match your filter.' : 'No materials uploaded yet.'}</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>Title</th><th>Class</th><th>Type</th><th>Date</th><th style={{ textAlign: 'right' }}></th></tr>
              </thead>
              <tbody>
                {filtered.map(m => (
                  <tr key={m.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {fileIcon(m.file_type)}
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{m.title}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                      {(m.classes as any)?.class_name}
                      {(m.classes as any)?.courses?.name && <span> · {(m.classes as any).courses.name}</span>}
                    </td>
                    <td>
                      <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600, color: 'var(--text-muted)' }}>
                        {m.file_type}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      {new Date(m.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <Link href={`/material-viewer?url=${encodeURIComponent(m.file_url)}&title=${encodeURIComponent(m.title)}`}>
                          <Button variant="ghost" size="sm" leftIcon={<ExternalLink size={12} />}>View</Button>
                        </Link>
                        <Button variant="ghost" size="sm" leftIcon={<Trash2 size={12} />}
                          style={{ color: 'var(--accent-red)' }} onClick={() => handleDelete(m.id)}>
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </SectionCard>
      </div>
    </div>
  )
}
