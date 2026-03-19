'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { SectionCard } from '@/components/ui/Card'
import { BookOpen, Plus, Trash2, Edit2, Users, Layers, ChevronRight, Search, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { SkeletonRow } from '@/components/ui/Loading'
import Link from 'next/link'

export default function AdminCoursesPage() {
  const [courses, setCourses]         = useState<any[]>([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [showModal, setShowModal]     = useState(false)
  const [editCourse, setEditCourse]   = useState<any | null>(null)
  const [deleteCourse, setDeleteCourse] = useState<any | null>(null)
  const [saving, setSaving]           = useState(false)
  const [deleting, setDeleting]       = useState(false)
  const [form, setForm]               = useState({ name: '', description: '' })
  const supabase = createClient()

  const fetchCourses = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('courses')
      .select('*, classes(id), course_enrollments(count)')
      .order('created_at', { ascending: false })
    if (error) toast.error(error.message)
    else setCourses(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchCourses() }, [fetchCourses])

  const openCreate = () => {
    setEditCourse(null)
    setForm({ name: '', description: '' })
    setShowModal(true)
  }

  const openEdit = (course: any) => {
    setEditCourse(course)
    setForm({ name: course.name, description: course.description || '' })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('Course name is required')
    setSaving(true)
    try {
      const method = editCourse ? 'PATCH' : 'POST'
      const body   = editCourse ? { id: editCourse.id, ...form } : form
      const res    = await fetch('/api/courses', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast.success(editCourse ? 'Course updated' : 'Course created')
      setShowModal(false)
      fetchCourses()
    } catch (err: any) {
      toast.error(err.message || 'Failed to save course')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteCourse) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/courses?id=${deleteCourse.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast.success('Course deleted')
      setDeleteCourse(null)
      fetchCourses()
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete')
    } finally {
      setDeleting(false)
    }
  }

  const filtered = courses.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.description || '').toLowerCase().includes(search.toLowerCase())
  )

  const totalClasses  = courses.reduce((s, c) => s + (c.classes?.length ?? 0), 0)
  const totalStudents = courses.reduce((s, c) => s + (c.course_enrollments?.[0]?.count ?? 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header flex items-center justify-between">
        <div>
          <h1>Courses</h1>
          <p>Create and manage courses. Add classes and assign teachers.</p>
        </div>
        <Button variant="gradient" leftIcon={<Plus size={16} />} onClick={openCreate}>
          New Course
        </Button>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {[
          { label: 'Total Courses', value: courses.length, icon: <BookOpen size={18} />, color: 'var(--accent-blue)' },
          { label: 'Total Classes', value: totalClasses,   icon: <Layers size={18} />,   color: 'var(--accent-green)' },
          { label: 'Enrolled Students', value: totalStudents, icon: <Users size={18} />, color: 'var(--accent-orange)' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, flexShrink: 0 }}>
              {s.icon}
            </div>
            <div>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>{s.value}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Courses Table */}
      <SectionCard
        title={`All Courses (${filtered.length})`}
        icon={undefined}
        action={
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search courses..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="form-input"
                style={{ width: 200, padding: '7px 12px 7px 32px', fontSize: '0.8125rem' }}
              />
            </div>
            <Button variant="ghost" size="sm" leftIcon={<RefreshCw size={13} />} onClick={fetchCourses}>
              Refresh
            </Button>
          </div>
        }
        scrollable
      >
        {loading ? (
          <table className="data-table"><tbody>{[...Array(4)].map((_, i) => <SkeletonRow key={i} cols={5} />)}</tbody></table>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            <BookOpen size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <p>{search ? 'No courses match your search.' : 'No courses yet. Create your first course.'}</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Course</th>
                <th>Classes</th>
                <th>Enrolled</th>
                <th>Created</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(course => {
                const classCount = course.classes?.length ?? 0
                const enrolled   = course.course_enrollments?.[0]?.count ?? 0
                return (
                  <tr key={course.id}>
                    <td>
                      <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{course.name}</p>
                      {course.description && (
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2, maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {course.description}
                        </p>
                      )}
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                        <Layers size={13} /> {classCount}
                      </span>
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                        <Users size={13} /> {enrolled}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      {new Date(course.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <Link href={`/admin/courses/${course.id}`}>
                          <Button variant="ghost" size="sm" rightIcon={<ChevronRight size={13} />}>Manage</Button>
                        </Link>
                        <Button variant="ghost" size="sm" leftIcon={<Edit2 size={13} />} onClick={() => openEdit(course)}>Edit</Button>
                        <Button variant="ghost" size="sm" leftIcon={<Trash2 size={13} />}
                          style={{ color: 'var(--accent-red)' }}
                          onClick={() => setDeleteCourse(course)}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </SectionCard>

      {/* Create / Edit Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editCourse ? 'Edit Course' : 'New Course'}
        footer={
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" loading={saving} leftIcon={<Plus size={15} />} onClick={handleSave}>
              {editCourse ? 'Save Changes' : 'Create Course'}
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input
            label="Course Name *"
            placeholder="e.g. Mathematics, Tajweed, English Literature"
            value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
          />
          <div>
            <label className="form-label">Description</label>
            <textarea
              className="form-input"
              placeholder="Brief description of the course..."
              rows={3}
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              style={{ resize: 'vertical', minHeight: 80, width: '100%' }}
            />
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmModal
        open={!!deleteCourse}
        onClose={() => setDeleteCourse(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Course"
        message={`Are you sure you want to delete "${deleteCourse?.name}"? This will also remove all its classes, assignments, and materials.`}
        confirmLabel="Delete"
        danger
      />
    </div>
  )
}
