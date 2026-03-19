'use client'

import { useState, useEffect, useCallback } from 'react'
import { use } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { SectionCard } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Users, Layers, Plus, Trash2, UserPlus, UserMinus } from 'lucide-react'
import Link from 'next/link'

export default function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: courseId } = use(params)
  const [course, setCourse]           = useState<any>(null)
  const [classes, setClasses]         = useState<any[]>([])
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [allStudents, setAllStudents] = useState<any[]>([])
  const [teachers, setTeachers]       = useState<any[]>([])
  const [loading, setLoading]         = useState(true)
  const [classForm, setClassForm]     = useState({ class_name: '', section: '', teacher_id: '' })
  const [saving, setSaving]           = useState(false)
  const supabase = createClient()

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [courseRes, classRes, enrollRes, studentsRes, teachersRes] = await Promise.all([
      supabase.from('courses').select('*').eq('id', courseId).single(),
      supabase.from('classes').select('*, users!classes_teacher_id_fkey(full_name)').eq('course_id', courseId).order('class_name'),
      supabase.from('course_enrollments').select('*, student:users!course_enrollments_student_id_fkey(id, full_name, email)').eq('course_id', courseId).order('enrolled_at'),
      supabase.from('users').select('id, full_name, email').eq('role', 'student').order('full_name'),
      supabase.from('users').select('id, full_name').eq('role', 'teacher').order('full_name'),
    ])
    setCourse(courseRes.data)
    setClasses(classRes.data || [])
    setEnrollments(enrollRes.data || [])
    setAllStudents((studentsRes.data || []))
    setTeachers(teachersRes.data || [])
    setLoading(false)
  }, [courseId])

  useEffect(() => { fetchAll() }, [fetchAll])

  const createClass = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!classForm.class_name.trim()) return toast.error('Class name required')
    setSaving(true)
    const { error } = await supabase.from('classes').insert({
      course_id: courseId,
      class_name: classForm.class_name.trim(),
      section: classForm.section.trim() || null,
      teacher_id: classForm.teacher_id || null,
    })
    setSaving(false)
    if (error) return toast.error(error.message)
    toast.success('Class added')
    setClassForm({ class_name: '', section: '', teacher_id: '' })
    fetchAll()
  }

  const deleteClass = async (id: string, name: string) => {
    if (!confirm(`Delete class "${name}"? This removes all its live sessions, materials and assignments.`)) return
    const { error } = await supabase.from('classes').delete().eq('id', id)
    if (error) return toast.error(error.message)
    toast.success('Class deleted')
    fetchAll()
  }

  const enrollStudent = async (studentId: string) => {
    const res = await fetch('/api/enrollments', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ course_id: courseId, student_ids: [studentId] }),
    })
    const json = await res.json()
    if (!res.ok) return toast.error(json.error)
    toast.success('Student enrolled')
    fetchAll()
  }

  const unenrollStudent = async (studentId: string) => {
    const res = await fetch(`/api/enrollments?course_id=${courseId}&student_id=${studentId}`, { method: 'DELETE' })
    const json = await res.json()
    if (!res.ok) return toast.error(json.error)
    toast.success('Student removed from course')
    fetchAll()
  }

  const enrolledIds = new Set(enrollments.map((e: any) => e.student_id))
  const unenrolledStudents = allStudents.filter(s => !enrolledIds.has(s.id))

  if (loading) return <p style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</p>
  if (!course) return <p style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Course not found.</p>

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 4 }}>
            <Link href="/admin/courses" style={{ color: 'var(--accent-blue)', textDecoration: 'none' }}>← All Courses</Link>
          </p>
          <h1>📖 {course.name}</h1>
          {course.description && <p>{course.description}</p>}
        </div>
      </div>

      <div className="dash-grid-main" style={{ alignItems: 'start' }}>
        <div className="space-y-5">
          {/* Add Class */}
          <SectionCard title="➕ Add Class to This Course" icon={<Layers size={15} />}>
            <form onSubmit={createClass} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="form-label">Class Name *</label>
                <input className="form-input" placeholder="e.g. Class 7, Batch A" value={classForm.class_name}
                  onChange={e => setClassForm(p => ({ ...p, class_name: e.target.value }))} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label">Section</label>
                  <input className="form-input" placeholder="e.g. A, Morning" value={classForm.section}
                    onChange={e => setClassForm(p => ({ ...p, section: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Assign Teacher</label>
                  <select className="form-input" value={classForm.teacher_id}
                    onChange={e => setClassForm(p => ({ ...p, teacher_id: e.target.value }))}>
                    <option value="">— Unassigned —</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                  </select>
                </div>
              </div>
              <Button type="submit" variant="primary" loading={saving} leftIcon={<Plus size={14} />}>Add Class</Button>
            </form>
          </SectionCard>

          {/* Classes List */}
          <SectionCard title={`Classes (${classes.length})`} icon={<Layers size={15} />} scrollable>
            {classes.length === 0 ? (
              <p style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>No classes yet. Add one above.</p>
            ) : (
              <table className="data-table">
                <thead><tr><th>Class</th><th>Section</th><th>Teacher</th><th></th></tr></thead>
                <tbody>
                  {classes.map(cls => (
                    <tr key={cls.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{cls.class_name}</td>
                      <td>{cls.section || '—'}</td>
                      <td>{cls.users?.full_name || <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>}</td>
                      <td>
                        <Button variant="ghost" size="sm" leftIcon={<Trash2 size={12} />}
                          onClick={() => deleteClass(cls.id, cls.class_name)}
                          style={{ color: 'var(--accent-red)' }}>Remove</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </SectionCard>
        </div>

        <div className="space-y-5">
          {/* Enrolled Students */}
          <SectionCard title={`Enrolled Students (${enrollments.length})`} icon={<Users size={15} />} scrollable>
            {enrollments.length === 0 ? (
              <p style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>No students enrolled yet.</p>
            ) : (
              <table className="data-table">
                <thead><tr><th>Student</th><th>Email</th><th></th></tr></thead>
                <tbody>
                  {enrollments.map((e: any) => (
                    <tr key={e.id}>
                      <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{e.student?.full_name}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>{e.student?.email}</td>
                      <td>
                        <Button variant="ghost" size="sm" leftIcon={<UserMinus size={12} />}
                          onClick={() => unenrollStudent(e.student_id)}
                          style={{ color: 'var(--accent-red)' }}>Remove</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </SectionCard>

          {/* Enroll Students */}
          {unenrolledStudents.length > 0 && (
            <SectionCard title="Enroll Students" icon={<UserPlus size={15} />} scrollable>
              <table className="data-table">
                <thead><tr><th>Student</th><th>Email</th><th></th></tr></thead>
                <tbody>
                  {unenrolledStudents.map(s => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{s.full_name}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>{s.email}</td>
                      <td>
                        <Button variant="ghost" size="sm" leftIcon={<UserPlus size={12} />}
                          onClick={() => enrollStudent(s.id)}
                          style={{ color: 'var(--accent-blue)' }}>Enroll</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  )
}
