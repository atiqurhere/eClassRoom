'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, FileText, Calendar, Users, BookOpen, Award, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { proxyFileUrl } from '@/lib/utils/proxyUrl'
import { Button } from '@/components/ui/Button'
import { SectionCard } from '@/components/ui/Card'
import { AssignmentForm } from '@/components/assignments/AssignmentForm'
import { GradingModal } from '@/components/assignments/GradingModal'
import { Loading } from '@/components/ui/Loading'
import { toast } from 'sonner'
import { useParams } from 'next/navigation'

export default function TeacherClassDetailPage() {
  const params = useParams()
  const courseId = params.id as string

  const [course, setCourse] = useState<any>(null)
  const [assignments, setAssignments] = useState<any[]>([])
  const [submissions, setSubmissions] = useState<any[]>([])
  const [materials, setMaterials] = useState<any[]>([])
  const [showCreateAssignment, setShowCreateAssignment] = useState(false)
  const [gradingTarget, setGradingTarget] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    const [courseRes, assignRes, matsRes] = await Promise.all([
      supabase.from('courses').select('*, classes(class_name, section), users!courses_teacher_id_fkey(full_name)').eq('id', courseId).single(),
      supabase.from('assignments').select('*, submissions(id, score, student_id, users!submissions_student_id_fkey(full_name))').eq('course_id', courseId).order('due_date'),
      supabase.from('course_materials').select('*').eq('course_id', courseId).order('created_at', { ascending: false }),
    ])
    setCourse(courseRes.data)
    setAssignments(assignRes.data || [])
    setMaterials(matsRes.data || [])
    setLoading(false)
  }, [courseId])

  useEffect(() => { fetchData() }, [fetchData])

  const deleteMaterial = async (id: string) => {
    const supabase = createClient()
    await supabase.from('course_materials').delete().eq('id', id)
    setMaterials(prev => prev.filter(m => m.id !== id))
    toast.success('Material removed')
  }

  if (loading) return <Loading text="Loading course..." />

  const courseName = course?.name || 'Course'
  const className = course?.classes ? `${course.classes.class_name}${course.classes.section ? ' — ' + course.classes.section : ''}` : ''
  const teacherName = (course?.users as any)?.full_name || 'Unassigned'

  return (
    <div className="space-y-6">
      <div className="page-header flex items-start justify-between">
        <div>
          <h1>{courseName}</h1>
          <p>{className} · Teacher: {teacherName}</p>
        </div>
        <Button variant="gradient" leftIcon={<Plus size={16} />}
          onClick={() => setShowCreateAssignment(v => !v)}>
          {showCreateAssignment ? 'Cancel' : 'Create Assignment'}
        </Button>
      </div>

      {showCreateAssignment && (
        <AssignmentForm courseId={courseId} onSuccess={() => { setShowCreateAssignment(false); fetchData() }} />
      )}

      {/* Assignments */}
      <SectionCard title={`Assignments (${assignments.length})`} icon={<BookOpen size={15} style={{ color: 'var(--accent-blue)' }} />}>
        {assignments.length === 0 ? (
          <div className="empty-state py-8">
            <div className="empty-state-icon"><BookOpen size={24} /></div>
            <h3>No assignments yet</h3>
            <p>Create the first assignment for this course</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {assignments.map(a => {
              const submittedCount = a.submissions?.length || 0
              const gradedCount = a.submissions?.filter((s: any) => s.score !== null).length || 0
              return (
                <div key={a.id} className="px-5 py-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{a.title}</p>
                      {a.description && <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{a.description}</p>}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="badge badge-blue"><FileText size={10} className="mr-1" />{submittedCount} submitted</span>
                      {gradedCount < submittedCount && (
                        <span className="badge badge-orange">{submittedCount - gradedCount} to grade</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--text-muted)' }}>
                    <span><Calendar size={13} className="inline mr-1" />Due {new Date(a.due_date).toLocaleDateString()}</span>
                    <span><Award size={13} className="inline mr-1" />Max: {a.max_score} pts</span>
                  </div>
                  {/* Submissions list */}
                  {a.submissions?.length > 0 && (
                    <div className="space-y-1 pt-1">
                      {a.submissions.map((sub: any) => (
                        <div key={sub.id} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
                          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            {sub.users?.full_name || 'Unknown'}
                          </span>
                          {sub.score !== null ? (
                            <span className="badge badge-green">{sub.score}/{a.max_score}</span>
                          ) : (
                            <Button size="sm" variant="secondary"
                              onClick={() => setGradingTarget({
                                id: sub.id,
                                student_name: sub.users?.full_name || 'Unknown',
                                assignment_title: a.title,
                                max_score: a.max_score,
                              })}>
                              Grade
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </SectionCard>

      {/* Materials */}
      <SectionCard title={`Course Materials (${materials.length})`} icon={<FileText size={15} style={{ color: 'var(--accent-orange)' }} />}>
        {materials.length === 0 ? (
          <div className="empty-state py-6">
            <div className="empty-state-icon"><FileText size={22} /></div>
            <h3>No materials yet</h3>
            <p>Upload materials from the Classes page</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {materials.map(m => (
              <div key={m.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.12)', color: 'var(--accent-orange)' }}>
                    <FileText size={14} />
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{m.title}</p>
                    {m.file_url && (
                      <a href={proxyFileUrl(m.file_url, m.title)} target="_blank" rel="noopener noreferrer"
                        className="text-xs" style={{ color: 'var(--accent-blue)' }}>View / Download</a>
                    )}
                  </div>
                </div>
                <button onClick={() => deleteMaterial(m.id)}
                  className="p-1.5 rounded-lg transition-colors"
                  style={{ color: 'var(--accent-red)', background: 'rgba(239,68,68,0.1)' }}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Grading modal */}
      <GradingModal
        isOpen={!!gradingTarget}
        onClose={() => setGradingTarget(null)}
        submission={gradingTarget}
        onGraded={fetchData}
      />
    </div>
  )
}