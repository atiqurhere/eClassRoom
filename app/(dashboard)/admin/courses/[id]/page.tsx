'use client'

import { useState, useEffect, useCallback } from 'react'
import { use } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { SectionCard } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { AvatarWithName } from '@/components/ui/Avatar'
import { SkeletonRow } from '@/components/ui/Loading'
import { Users, Layers, Plus, Trash2, UserPlus, UserMinus, ArrowLeft, Search, GraduationCap } from 'lucide-react'
import Link from 'next/link'

export default function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: courseId } = use(params)
  const [course, setCourse]             = useState<any>(null)
  const [classes, setClasses]           = useState<any[]>([])
  const [enrollments, setEnrollments]   = useState<any[]>([])
  const [allStudents, setAllStudents]   = useState<any[]>([])
  const [teachers, setTeachers]         = useState<any[]>([])
  const [loading, setLoading]           = useState(true)
  const [showClassModal, setShowClassModal]       = useState(false)
  const [showEnrollModal, setShowEnrollModal]     = useState(false)
  const [deleteClass, setDeleteClass]             = useState<any | null>(null)
  const [unenrollTarget, setUnenrollTarget]       = useState<any | null>(null)
  const [savingClass, setSavingClass]             = useState(false)
  const [savingEnroll, setSavingEnroll]           = useState(false)
  const [deletingClass, setDeletingClass]         = useState(false)
  const [unenrolling, setUnenrolling]             = useState(false)
  const [enrollSearch, setEnrollSearch]           = useState('')
  const [classForm, setClassForm] = useState({ class_name: '', section: '', teacher_id: '' })
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
    setAllStudents(studentsRes.data || [])
    setTeachers(teachersRes.data || [])
    setLoading(false)
  }, [courseId])

  useEffect(() => { fetchAll() }, [fetchAll])

  const handleAddClass = async () => {
    if (!classForm.class_name.trim()) return toast.error('Class name required')
    setSavingClass(true)
    const { error } = await supabase.from('classes').insert({
      course_id: courseId,
      class_name: classForm.class_name.trim(),
      section: classForm.section.trim() || null,
      teacher_id: classForm.teacher_id || null,
    })
    setSavingClass(false)
    if (error) return toast.error(error.message)
    toast.success('Class added')
    setShowClassModal(false)
    setClassForm({ class_name: '', section: '', teacher_id: '' })
    fetchAll()
  }

  const handleDeleteClass = async () => {
    if (!deleteClass) return
    setDeletingClass(true)
    const { error } = await supabase.from('classes').delete().eq('id', deleteClass.id)
    setDeletingClass(false)
    if (error) return toast.error(error.message)
    toast.success('Class removed')
    setDeleteClass(null)
    fetchAll()
  }

  const handleEnroll = async (studentId: string) => {
    setSavingEnroll(true)
    const res = await fetch('/api/enrollments', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ course_id: courseId, student_ids: [studentId] }),
    })
    setSavingEnroll(false)
    const json = await res.json()
    if (!res.ok) return toast.error(json.error)
    toast.success('Student enrolled')
    fetchAll()
  }

  const handleUnenroll = async () => {
    if (!unenrollTarget) return
    setUnenrolling(true)
    const res = await fetch(`/api/enrollments?course_id=${courseId}&student_id=${unenrollTarget.student_id}`, { method: 'DELETE' })
    setUnenrolling(false)
    const json = await res.json()
    if (!res.ok) return toast.error(json.error)
    toast.success('Student removed from course')
    setUnenrollTarget(null)
    fetchAll()
  }

  const enrolledIds = new Set(enrollments.map((e: any) => e.student_id))
  const unenrolledStudents = allStudents
    .filter(s => !enrolledIds.has(s.id))
    .filter(s => !enrollSearch || s.full_name.toLowerCase().includes(enrollSearch.toLowerCase()) || s.email.toLowerCase().includes(enrollSearch.toLowerCase()))

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--text-muted)' }}>
      Loading course...
    </div>
  )
  if (!course) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--text-muted)' }}>
      Course not found.
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 6 }}>
          <Link href="/admin/courses" style={{ color: 'var(--accent-blue)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <ArrowLeft size={12} /> All Courses
          </Link>
        </p>
        <h1>{course.name}</h1>
        {course.description && <p>{course.description}</p>}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, maxWidth: 400 }}>
        {[
          { label: 'Classes', value: classes.length, icon: <Layers size={16} />, color: 'var(--accent-blue)' },
          { label: 'Students Enrolled', value: enrollments.length, icon: <Users size={16} />, color: 'var(--accent-green)' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, flexShrink: 0 }}>
              {s.icon}
            </div>
            <div>
              <p style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>{s.value}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="dash-grid-main" style={{ alignItems: 'start' }}>
        {/* LEFT — Classes */}
        <SectionCard
          title={`Classes (${classes.length})`}
          icon={<Layers size={15} style={{ color: 'var(--accent-blue)' }} />}
          action={
            <Button variant="gradient" size="sm" leftIcon={<Plus size={13} />} onClick={() => setShowClassModal(true)}>
              Add Class
            </Button>
          }
          scrollable
        >
          {classes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--text-muted)' }}>
              <Layers size={28} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
              <p>No classes yet. Add the first class to this course.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>Class</th><th>Section</th><th>Teacher</th><th style={{ textAlign: 'right' }}></th></tr>
              </thead>
              <tbody>
                {classes.map(cls => (
                  <tr key={cls.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{cls.class_name}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{cls.section || '—'}</td>
                    <td>
                      {cls.users?.full_name
                        ? <span style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>{cls.users.full_name}</span>
                        : <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>Unassigned</span>}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Button variant="ghost" size="sm" leftIcon={<Trash2 size={12} />}
                        style={{ color: 'var(--accent-red)' }}
                        onClick={() => setDeleteClass(cls)}>
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </SectionCard>

        {/* RIGHT — Enrolled Students */}
        <SectionCard
          title={`Enrolled Students (${enrollments.length})`}
          icon={<GraduationCap size={15} style={{ color: 'var(--accent-green)' }} />}
          action={
            <Button variant="gradient" size="sm" leftIcon={<UserPlus size={13} />} onClick={() => { setEnrollSearch(''); setShowEnrollModal(true) }}>
              Enroll
            </Button>
          }
          scrollable
        >
          {enrollments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--text-muted)' }}>
              <Users size={28} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
              <p>No students enrolled yet.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>Student</th><th>Email</th><th style={{ textAlign: 'right' }}></th></tr>
              </thead>
              <tbody>
                {enrollments.map((e: any) => (
                  <tr key={e.id}>
                    <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{e.student?.full_name}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>{e.student?.email}</td>
                    <td style={{ textAlign: 'right' }}>
                      <Button variant="ghost" size="sm" leftIcon={<UserMinus size={12} />}
                        style={{ color: 'var(--accent-red)' }}
                        onClick={() => setUnenrollTarget(e)}>
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </SectionCard>
      </div>

      {/* Add Class Modal */}
      <Modal
        isOpen={showClassModal}
        onClose={() => setShowClassModal(false)}
        title="Add Class"
        footer={
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setShowClassModal(false)}>Cancel</Button>
            <Button variant="primary" loading={savingClass} leftIcon={<Plus size={14} />} onClick={handleAddClass}>
              Add Class
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="Class Name *" placeholder="e.g. Class 7, Batch A, Morning Batch"
            value={classForm.class_name} onChange={e => setClassForm(p => ({ ...p, class_name: e.target.value }))} />
          <Input label="Section" placeholder="e.g. A, B (optional)"
            value={classForm.section} onChange={e => setClassForm(p => ({ ...p, section: e.target.value }))} />
          <div>
            <label className="form-label">Assign Teacher</label>
            <select className="form-input" value={classForm.teacher_id}
              onChange={e => setClassForm(p => ({ ...p, teacher_id: e.target.value }))}>
              <option value="">— Unassigned —</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
            </select>
          </div>
        </div>
      </Modal>

      {/* Enroll Students Modal */}
      <Modal
        isOpen={showEnrollModal}
        onClose={() => setShowEnrollModal(false)}
        title="Enroll Students"
        footer={<Button variant="ghost" onClick={() => setShowEnrollModal(false)}>Close</Button>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input type="text" placeholder="Search students..." value={enrollSearch}
              onChange={e => setEnrollSearch(e.target.value)}
              className="form-input"
              style={{ width: '100%', padding: '8px 12px 8px 32px' }} />
          </div>
          {unenrolledStudents.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              {enrollSearch ? 'No students match your search.' : 'All students are already enrolled.'}
            </p>
          ) : (
            <div style={{ maxHeight: 360, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {unenrolledStudents.map(s => (
                <div key={s.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 12px', borderRadius: 8,
                  background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                }}>
                  <div>
                    <p style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{s.full_name}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{s.email}</p>
                  </div>
                  <Button variant="ghost" size="sm" leftIcon={<UserPlus size={12} />}
                    style={{ color: 'var(--accent-blue)' }}
                    loading={savingEnroll}
                    onClick={() => handleEnroll(s.id)}>
                    Enroll
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Delete Class Confirm */}
      <ConfirmModal
        isOpen={!!deleteClass}
        onClose={() => setDeleteClass(null)}
        onConfirm={handleDeleteClass}
        loading={deletingClass}
        title="Remove Class"
        message={`Remove class "${deleteClass?.class_name}"? This also deletes all its live sessions, materials, and assignments.`}
        confirmLabel="Remove"
        confirmVariant="danger"
      />

      {/* Unenroll Confirm */}
      <ConfirmModal
        isOpen={!!unenrollTarget}
        onClose={() => setUnenrollTarget(null)}
        onConfirm={handleUnenroll}
        loading={unenrolling}
        title="Remove Student"
        message={`Remove ${unenrollTarget?.student?.full_name} from this course?`}
        confirmLabel="Remove"
        confirmVariant="danger"
      />
    </div>
  )
}
