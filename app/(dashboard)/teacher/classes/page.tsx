'use client'

import { useState, useEffect, useCallback } from 'react'
import { Video, BookOpen, Plus, FileText, Pencil, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { SectionCard } from '@/components/ui/Card'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { AvatarWithName } from '@/components/ui/Avatar'
import { Loading } from '@/components/ui/Loading'
import Link from 'next/link'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { formatDistanceToNow } from 'date-fns'

export default function TeacherClassesPage() {
  const { user, loading: authLoading } = useAuth()
  const [courses, setCourses] = useState<any[]>([])
  const [materials, setMaterials] = useState<any[]>([])
  const [selectedCourse, setSelectedCourse] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showMaterialModal, setShowMaterialModal] = useState(false)
  const [showAssignmentModal, setShowAssignmentModal] = useState(false)
  const [saving, setSaving] = useState(false)

  const matForm = useForm<any>()
  const assignForm = useForm<any>({ defaultValues: { max_score: 100 } })

  const fetchCourses = useCallback(async () => {
    if (authLoading) return
    if (!user) { setLoading(false); return }
    setLoading(true)
    const supabase = createClient()
    // v2: teachers are assigned to classes, not courses
    const { data } = await supabase
      .from('classes')
      .select('id, class_name, section, course_id, courses(id, name)')
      .eq('teacher_id', user.id)
      .order('class_name')
    setCourses(data || [])
    if (data?.length && !selectedCourse) setSelectedCourse(data[0])
    setLoading(false)
  }, [user, selectedCourse])

  const fetchMaterials = useCallback(async () => {
    if (!selectedCourse) return
    const supabase = createClient()
    const { data } = await supabase.from('materials').select('*').eq('class_id', selectedCourse.id).order('created_at', { ascending: false })
    setMaterials(data || [])
  }, [selectedCourse])

  useEffect(() => { fetchCourses() }, [fetchCourses])
  useEffect(() => { if (selectedCourse) fetchMaterials() }, [selectedCourse, fetchMaterials])

  const handleAddMaterial = async (data: any) => {
    if (!selectedCourse || !user) return
    try {
      setSaving(true)
      const supabase = createClient()
      const { error } = await supabase.from('materials').insert({ ...data, class_id: selectedCourse.id, teacher_id: user.id })
      if (error) throw error
      toast.success('Material added')
      setShowMaterialModal(false)
      matForm.reset()
      fetchMaterials()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleCreateAssignment = async (data: any) => {
    if (!selectedCourse || !user) return
    try {
      setSaving(true)
      const supabase = createClient()
      const { error } = await supabase.from('assignments').insert({
        ...data,
        course_id: selectedCourse.id,
        teacher_id: user.id,
        due_date: new Date(data.due_date).toISOString(),
        max_score: Number(data.max_score),
      })
      if (error) throw error
      // Notify students
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'New Assignment', message: `"${data.title}" is due soon.`,
          type: 'assignment', targetRole: 'student', classId: selectedCourse.class_id,
        }),
      })
      toast.success('Assignment created!')
      setShowAssignmentModal(false)
      assignForm.reset()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const deleteMaterial = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase.from('materials').delete().eq('id', id)
    if (!error) { toast.success('Removed'); fetchMaterials() }
  }

  if (loading) return <Loading text="Loading courses..." />

  return (
    <div className="space-y-6">
      <div className="page-header flex items-center justify-between">
        <div><h1>My Classes</h1><p>Manage materials and assignments per course</p></div>
        {selectedCourse && (
          <div className="flex gap-2">
            <Button variant="secondary" leftIcon={<FileText size={15} />} onClick={() => setShowMaterialModal(true)}>Add Material</Button>
            <Button variant="gradient" leftIcon={<Plus size={15} />} onClick={() => setShowAssignmentModal(true)}>New Assignment</Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Course list */}
        <div className="xl:col-span-1">
          <SectionCard title="Courses" icon={<BookOpen size={15} style={{ color: 'var(--accent-blue)' }} />} bodyClassName="p-2">
            {courses.length === 0 ? (
              <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>No courses assigned</p>
            ) : (
              <div className="space-y-1">
                {courses.map(c => (
                  <button key={c.id} onClick={() => setSelectedCourse(c)}
                    className="w-full text-left p-3 rounded-lg transition-all"
                    style={{
                      background: selectedCourse?.id === c.id ? 'rgba(79,142,247,0.15)' : 'transparent',
                      border: selectedCourse?.id === c.id ? '1px solid rgba(79,142,247,0.3)' : '1px solid transparent',
                      color: selectedCourse?.id === c.id ? 'var(--accent-blue)' : 'var(--text-secondary)',
                    }}>
                    <p className="text-sm font-semibold">{(c as any).class_name}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{(c as any).courses?.name}</p>
                  </button>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Course detail */}
        <div className="xl:col-span-3">
          {!selectedCourse ? (
            <div className="empty-state" style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)' }}>
              <div className="empty-state-icon"><BookOpen size={28} /></div>
              <h3>Select a course</h3>
              <p>Pick a course from the left to manage its materials and assignments</p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Course header */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
                <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{selectedCourse.class_name}</h2>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{selectedCourse.courses?.name}{selectedCourse.section ? ` · ${selectedCourse.section}` : ''}</p>
                <div className="flex gap-2 mt-3">
                  <Link href={`/teacher/live-class?classId=${selectedCourse.id}`}>
                    <Button variant="gradient" size="sm" leftIcon={<Video size={14} />}>Start Live Class</Button>
                  </Link>
                  <Link href={`/teacher/attendance?classId=${selectedCourse.id}`}>
                    <Button variant="secondary" size="sm">View Attendance</Button>
                  </Link>
                </div>
              </div>

              {/* Materials */}
              <SectionCard
                title="Course Materials"
                icon={<FileText size={15} style={{ color: 'var(--accent-purple)' }} />}
                action={<Button variant="ghost" size="sm" leftIcon={<Plus size={13} />} onClick={() => setShowMaterialModal(true)}>Add</Button>}
              >
                {materials.length === 0 ? (
                  <div className="empty-state py-6">
                    <div className="empty-state-icon"><FileText size={24} /></div>
                    <h3>No materials yet</h3>
                    <p>Upload PDFs, docs, or share links for students</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {materials.map(m => (
                      <div key={m.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg-hover)' }}>
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(139,92,246,0.15)', color: 'var(--accent-purple)' }}>
                            <FileText size={15} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{m.title}</p>
                            <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          {m.file_url && <a href={m.file_url} target="_blank" rel="noreferrer"><Button variant="ghost" size="sm">Open</Button></a>}
                          <button onClick={() => deleteMaterial(m.id)} className="p-1.5 rounded-lg" style={{ color: 'var(--accent-red)', background: 'rgba(239,68,68,0.1)' }}><Trash2 size={13} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>
            </div>
          )}
        </div>
      </div>

      {/* Add Material Modal */}
      <Modal isOpen={showMaterialModal} onClose={() => setShowMaterialModal(false)} title="Add Course Material" size="sm"
        footer={<><Button variant="secondary" onClick={() => setShowMaterialModal(false)}>Cancel</Button><Button variant="gradient" loading={saving} onClick={matForm.handleSubmit(handleAddMaterial)}>Add Material</Button></>}>
        <form className="space-y-4">
          <Input label="Title" placeholder="e.g. Chapter 3 Notes" {...matForm.register('title', { required: true })} />
          <Textarea label="Description (optional)" placeholder="Brief description..." {...matForm.register('description')} />
          <Input label="File URL or Link" placeholder="https://..." {...matForm.register('file_url', { required: true })} />
          <Select label="Type" options={[{ value: 'pdf', label: 'PDF' }, { value: 'doc', label: 'Document' }, { value: 'video', label: 'Video' }, { value: 'link', label: 'Link' }]} {...matForm.register('file_type')} />
        </form>
      </Modal>

      {/* Create Assignment Modal */}
      <Modal isOpen={showAssignmentModal} onClose={() => setShowAssignmentModal(false)} title="Create Assignment" size="md"
        footer={<><Button variant="secondary" onClick={() => setShowAssignmentModal(false)}>Cancel</Button><Button variant="gradient" loading={saving} onClick={assignForm.handleSubmit(handleCreateAssignment)}>Create</Button></>}>
        <form className="space-y-4">
          <Input label="Title" placeholder="Assignment title" {...assignForm.register('title', { required: true })} />
          <Textarea label="Description" placeholder="Instructions..." {...assignForm.register('description')} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Due Date & Time" type="datetime-local" {...assignForm.register('due_date', { required: true })} />
            <Input label="Max Score" type="number" {...assignForm.register('max_score')} />
          </div>
        </form>
      </Modal>
    </div>
  )
}
