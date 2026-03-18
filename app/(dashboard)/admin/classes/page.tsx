'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, BookOpen, Users, Pencil, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { SectionCard } from '@/components/ui/Card'
import { AvatarWithName } from '@/components/ui/Avatar'
import { SkeletonRow } from '@/components/ui/Loading'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'

interface ClassRecord {
  id: string
  class_name: string
  section: string
  academic_year: string
  teacher_id: string
  // Supabase join returns a single object for fkey relations
  users?: { full_name: string } | { full_name: string }[] | null
  _count?: { students: number }
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

  const { register, handleSubmit, reset, formState: { errors } } = useForm<any>()

  const fetchData = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const [classRes, teacherRes] = await Promise.all([
      supabase.from('classes').select('id, class_name, section, academic_year, teacher_id, users!classes_teacher_id_fkey(full_name)').order('class_name'),
      supabase.from('users').select('id, full_name').eq('role', 'teacher'),
    ])
    setClasses(classRes.data || [])
    setTeachers(teacherRes.data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = classes.filter(c =>
    !search || c.class_name.toLowerCase().includes(search.toLowerCase())
  )

  const handleSave = async (data: any) => {
    try {
      setSaving(true)
      const supabase = createClient()
      if (editItem) {
        const { error } = await supabase.from('classes').update(data).eq('id', editItem.id)
        if (error) throw error
        toast.success('Class updated')
      } else {
        const { error } = await supabase.from('classes').insert(data)
        if (error) throw error
        toast.success('Class created')
      }
      setShowModal(false)
      setEditItem(null)
      reset()
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to save class')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteItem) return
    try {
      setDeleting(true)
      const supabase = createClient()
      const { error } = await supabase.from('classes').delete().eq('id', deleteItem.id)
      if (error) throw error
      toast.success('Class deleted')
      setDeleteItem(null)
      fetchData()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="page-header flex items-center justify-between">
        <div><h1>Class Management</h1><p>Manage classes and assign teachers</p></div>
        <Button variant="gradient" leftIcon={<Plus size={16} />} onClick={() => { reset(); setEditItem(null); setShowModal(true) }}>
          New Class
        </Button>
      </div>

      <SectionCard
        title={`Classes (${filtered.length})`}
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
            <tr><th>Class Name</th><th>Section</th><th>Academic Year</th><th>Teacher</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8" style={{ color: 'var(--text-muted)' }}>No classes yet</td></tr>
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
                  <td>{cls.section || '—'}</td>
                  <td>{cls.academic_year || '—'}</td>
                  <td>
                    {cls.users ? (
                      <AvatarWithName name={(cls.users as any)?.full_name} size="xs" />
                    ) : <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>}
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditItem(cls); reset({ class_name: cls.class_name, section: cls.section, academic_year: cls.academic_year, teacher_id: cls.teacher_id }); setShowModal(true) }}
                        className="p-1.5 rounded-lg" style={{ color: 'var(--accent-blue)', background: 'rgba(79,142,247,0.1)' }}>
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => setDeleteItem(cls)} className="p-1.5 rounded-lg" style={{ color: 'var(--accent-red)', background: 'rgba(239,68,68,0.1)' }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </SectionCard>

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditItem(null) }}
        title={editItem ? 'Edit Class' : 'Create New Class'} size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setShowModal(false); setEditItem(null) }}>Cancel</Button>
            <Button variant="gradient" loading={saving} onClick={handleSubmit(handleSave)}>
              {editItem ? 'Save Changes' : 'Create Class'}
            </Button>
          </>
        }>
        <form className="space-y-4">
          <Input label="Class Name" placeholder="e.g. Class 10A" error={errors.class_name?.message as string} {...register('class_name', { required: 'Class name is required' })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Section" placeholder="e.g. A" {...register('section')} />
            <Input label="Academic Year" placeholder="e.g. 2026" {...register('academic_year')} />
          </div>
          <Select label="Assign Teacher" placeholder="Select teacher"
            options={teachers.map(t => ({ value: t.id, label: t.full_name }))}
            {...register('teacher_id')} />
        </form>
      </Modal>

      <ConfirmModal isOpen={!!deleteItem} onClose={() => setDeleteItem(null)} onConfirm={handleDelete}
        title="Delete Class" message={`Delete "${deleteItem?.class_name}"? This will remove all associated courses and data.`}
        confirmLabel="Delete" confirmVariant="danger" loading={deleting} />
    </div>
  )
}
