'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { SectionCard } from '@/components/ui/Card'
import { BookOpen, Plus, Trash2, Edit2, Users, Layers, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

export default function AdminCoursesPage() {
  const [courses, setCourses]   = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [creating, setCreating] = useState(false)
  const [editId, setEditId]     = useState<string | null>(null)
  const [form, setForm]         = useState({ name: '', description: '' })
  const supabase = createClient()

  const fetchCourses = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('courses')
      .select('*, classes(id, class_name, section, teacher_id, users!classes_teacher_id_fkey(full_name)), course_enrollments(count)')
      .order('created_at', { ascending: false })
    if (error) toast.error(error.message)
    else setCourses(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchCourses() }, [fetchCourses])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('Course name is required')
    setCreating(true)

    const method = editId ? 'PATCH' : 'POST'
    const body = editId ? { id: editId, ...form } : form
    const res = await fetch('/api/courses', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const json = await res.json()
    setCreating(false)

    if (!res.ok) return toast.error(json.error)
    toast.success(editId ? 'Course updated' : 'Course created')
    setForm({ name: '', description: '' })
    setEditId(null)
    fetchCourses()
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}" and all its classes?`)) return
    const res = await fetch(`/api/courses?id=${id}`, { method: 'DELETE' })
    const json = await res.json()
    if (!res.ok) return toast.error(json.error)
    toast.success('Course deleted')
    fetchCourses()
  }

  const startEdit = (course: any) => {
    setEditId(course.id)
    setForm({ name: course.name, description: course.description || '' })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="space-y-5">
      <div className="page-header">
        <h1>📚 Courses</h1>
        <p>Create and manage courses. Add classes to each course and assign teachers.</p>
      </div>

      {/* Create / Edit Form */}
      <SectionCard title={editId ? '✏️ Edit Course' : '➕ New Course'} icon={<BookOpen size={16} />}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '4px 0' }}>
          <div>
            <label className="form-label">Course Name *</label>
            <input className="form-input" placeholder="e.g. Mathematics, English Literature" value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
          </div>
          <div>
            <label className="form-label">Description</label>
            <textarea className="form-input" placeholder="Brief description of the course…" rows={3} value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              style={{ resize: 'vertical', minHeight: 80 }} />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button type="submit" variant="primary" loading={creating} leftIcon={<Plus size={15} />}>
              {editId ? 'Update Course' : 'Create Course'}
            </Button>
            {editId && (
              <Button type="button" variant="ghost" onClick={() => { setEditId(null); setForm({ name: '', description: '' }) }}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </SectionCard>

      {/* Courses List */}
      <SectionCard title={`All Courses (${courses.length})`} icon={<Layers size={16} />}>
        {loading ? (
          <p style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>Loading…</p>
        ) : courses.length === 0 ? (
          <p style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No courses yet. Create one above.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {courses.map((course, i) => {
              const classCount      = (course.classes || []).length
              const enrollmentCount = course.course_enrollments?.[0]?.count ?? 0
              return (
                <div key={course.id} style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px',
                  borderBottom: i < courses.length - 1 ? '1px solid var(--border)' : 'none',
                  flexWrap: 'wrap',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9375rem' }}>{course.name}</p>
                    {course.description && (
                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{course.description}</p>
                    )}
                    <div style={{ display: 'flex', gap: 14, marginTop: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Layers size={12} /> {classCount} class{classCount !== 1 ? 'es' : ''}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Users size={12} /> {enrollmentCount} enrolled
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                    <Link href={`/admin/courses/${course.id}`}>
                      <Button variant="ghost" size="sm" rightIcon={<ChevronRight size={14} />}>Manage</Button>
                    </Link>
                    <Button variant="ghost" size="sm" leftIcon={<Edit2 size={13} />} onClick={() => startEdit(course)}>Edit</Button>
                    <Button variant="ghost" size="sm" leftIcon={<Trash2 size={13} />}
                      onClick={() => handleDelete(course.id, course.name)}
                      style={{ color: 'var(--accent-red)' }}>Delete</Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </SectionCard>
    </div>
  )
}
