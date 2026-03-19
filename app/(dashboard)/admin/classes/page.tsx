'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, BookOpen, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { SectionCard } from '@/components/ui/Card'
import { AvatarWithName } from '@/components/ui/Avatar'
import { SkeletonRow } from '@/components/ui/Loading'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

interface ClassRecord {
  id: string
  class_name: string
  section: string
  academic_year: string
  course_id: string
  teacher_id: string
  users?: { full_name: string } | null
  courses?: { name: string } | null
}

export default function AdminClassesPage() {
  const [classes, setClasses] = useState<ClassRecord[]>([])
  const [teachers, setTeachers] = useState<{ id: string; full_name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<ClassRecord | null>(null)
  const [deleteItem, setDeleteItem] = useState<ClassRecord | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [courses, setCourses] = useState<{ id: string; name: string }[]>([])
  const [form, setForm] = useState({ class_name: '', section: '', academic_year: '', teacher_id: '', course_id: '' })

  const fetchData = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const [classRes, teacherRes, courseRes] = await Promise.all([
      fetch('/api/admin/classes').then(r => r.json()),
      supabase.from('users').select('id, full_name').eq('role', 'teacher'),
      supabase.from('courses').select('id, name').order('name'),
    ])
    setClasses(classRes.classes || [])
    setTeachers(teacherRes.data || [])
    setCourses(courseRes.data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = classes.filter(c =>
    !search || c.class_name.toLowerCase().includes(search.toLowerCase())
  )

  const openCreate = () => {
    setForm({ class_name: '', section: '', academic_year: '', teacher_id: '', course_id: '' })
    setEditItem(null)
    setShowModal(true)
  }
  const openEdit = (cls: ClassRecord) => {
    setForm({ class_name: cls.class_name, section: cls.section || '', academic_year: cls.academic_year || '', teacher_id: cls.teacher_id || '', course_id: cls.course_id || '' })
    setEditItem(cls)
    setShowModal(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.class_name.trim()) { toast.error('Class name is required'); return }
    setSaving(true)
    try {
      let res: Response
      if (editItem) {
        res = await fetch(`/api/admin/classes?id=${editItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
      } else {
        res = await fetch('/api/admin/classes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
      }
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to save')
      toast.success(editItem ? 'Class updated' : 'Class created')
      setShowModal(false)
      setEditItem(null)
      fetchData()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteItem) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/classes?id=${deleteItem.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to delete')
      toast.success('Class deleted')
      setDeleteItem(null)
      fetchData()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setDeleting(false)
    }
  }

  const inp  = { width: '100%', padding: '9px 12px', background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.875rem', boxSizing: 'border-box' as const }

  return (
    <div className="space-y-6">
      <div className="page-header flex items-center justify-between">
        <div><h1>Class Management</h1><p>Manage classes and assign teachers</p></div>
        <Button variant="gradient" leftIcon={<Plus size={16} />} onClick={openCreate}>New Class</Button>
      </div>

      <SectionCard
        title={`Classes (${filtered.length})`}
        scrollable
        action={
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
              className="form-input pl-8" style={{ width: 200, padding: '7px 12px 7px 32px', fontSize: '0.8125rem' }} />
          </div>
        }
      >
        <table className="data-table">
          <thead>
            <tr><th>Class Name</th><th>Course</th><th>Section</th><th>Academic Year</th><th>Teacher</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8" style={{ color: 'var(--text-muted)' }}>No classes yet — click &quot;New Class&quot; to create one.</td></tr>
            ) : (
              filtered.map(cls => (
                <tr key={cls.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(79,142,247,0.15)', color: 'var(--accent-blue)' }}>
                        <BookOpen size={13} />
                      </div>
                      <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{cls.class_name}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{(cls.courses as any)?.name || '—'}</td>
                  <td>{cls.section || '—'}</td>
                  <td>{cls.academic_year || '—'}</td>
                  <td>
                    {cls.users ? <AvatarWithName name={(cls.users as any)?.full_name} size="xs" /> : <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>}
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(cls)} className="p-1.5 rounded-lg" style={{ color: 'var(--accent-blue)', background: 'rgba(79,142,247,0.1)' }}><Pencil size={13} /></button>
                      <button onClick={() => setDeleteItem(cls)} className="p-1.5 rounded-lg" style={{ color: 'var(--accent-red)', background: 'rgba(239,68,68,0.1)' }}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </SectionCard>

      {/* Create/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditItem(null) }}
        title={editItem ? 'Edit Class' : 'Create New Class'} size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setShowModal(false); setEditItem(null) }}>Cancel</Button>
            <Button variant="gradient" loading={saving} onClick={handleSave as any}>
              {editItem ? 'Save Changes' : 'Create Class'}
            </Button>
          </>
        }>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Belongs to Course *</label>
            <select value={form.course_id} onChange={e => setForm(p => ({ ...p, course_id: e.target.value }))} required style={inp}>
              <option value="">Select course…</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Class Name *</label>
            <input value={form.class_name} onChange={e => setForm(p => ({ ...p, class_name: e.target.value }))} required placeholder="e.g. Class 10A" style={inp} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Section</label>
              <input value={form.section} onChange={e => setForm(p => ({ ...p, section: e.target.value }))} placeholder="e.g. A" style={inp} />
            </div>
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Academic Year</label>
              <input value={form.academic_year} onChange={e => setForm(p => ({ ...p, academic_year: e.target.value }))} placeholder="e.g. 2026" style={inp} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Assign Teacher</label>
            <select value={form.teacher_id} onChange={e => setForm(p => ({ ...p, teacher_id: e.target.value }))} style={inp}>
              <option value="">No teacher assigned</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
            </select>
          </div>
        </form>
      </Modal>

      <ConfirmModal isOpen={!!deleteItem} onClose={() => setDeleteItem(null)} onConfirm={handleDelete}
        title="Delete Class" message={`Delete "${deleteItem?.class_name}"? This will remove all associated courses and data.`}
        confirmLabel="Delete" confirmVariant="danger" loading={deleting} />
    </div>
  )
}
