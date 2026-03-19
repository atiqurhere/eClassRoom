'use client'

import { useState, useEffect, useCallback } from 'react'
import { BookOpen, FileText, ChevronRight, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { SectionCard } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { Loading } from '@/components/ui/Loading'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

export default function StudentClassesPage() {
  const { user } = useAuth()
  // In v2: a "course" is the top-level item; each course has many classes.
  // The student is enrolled into a COURSE via course_enrollments.
  // We show courses in the sidebar, then the selected course's classes + materials + assignments.
  const [courses, setCourses] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)   // selected course
  const [materials, setMaterials] = useState<any[]>([])
  const [assignments, setAssignments] = useState<any[]>([])
  const [submissions, setSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)

  const fetchCourses = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const supabase = createClient()
    // v2: get enrolled courses
    const { data: enrollments } = await supabase
      .from('course_enrollments')
      .select('course_id, courses(id, name, description, classes(id, class_name, section, teacher_id, users!classes_teacher_id_fkey(full_name)))')
      .eq('student_id', user.id)
      .order('enrolled_at', { ascending: false })

    const fetched = (enrollments || []).map((e: any) => e.courses).filter(Boolean)
    setCourses(fetched)
    if (fetched.length) setSelected(fetched[0])
    setLoading(false)
  }, [user])

  const fetchDetail = useCallback(async () => {
    if (!selected || !user) return
    setDetailLoading(true)
    const supabase = createClient()
    // Get classIds for the selected course
    const classIds = (selected.classes || []).map((c: any) => c.id)

    const [matRes, asgRes, subRes] = await Promise.all([
      classIds.length
        ? supabase.from('materials').select('*').in('class_id', classIds).order('created_at', { ascending: false })
        : Promise.resolve({ data: [] }),
      classIds.length
        ? supabase.from('assignments').select('id, title, description, due_date, max_score, class_id, classes(class_name)').in('class_id', classIds).order('due_date', { ascending: true })
        : Promise.resolve({ data: [] }),
      supabase.from('submissions').select('id, status, score, assignment_id').eq('student_id', user.id),
    ])
    setMaterials(matRes.data || [])
    setAssignments(asgRes.data || [])
    setSubmissions(subRes.data || [])
    setDetailLoading(false)
  }, [selected, user])

  useEffect(() => { fetchCourses() }, [fetchCourses])
  useEffect(() => { fetchDetail() }, [fetchDetail])

  const getSubmission = (assignmentId: string) => submissions.find(s => s.assignment_id === assignmentId)

  if (loading) return <Loading text="Loading your courses..." />

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1>My Classes</h1>
        <p>Access your course materials and assignments</p>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Course list */}
        <SectionCard title="Courses" icon={<BookOpen size={15} style={{ color: 'var(--accent-blue)' }} />} className="xl:col-span-1" bodyClassName="p-2">
          {courses.length === 0 ? (
            <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>Not enrolled in any course yet</p>
          ) : (
            <div className="space-y-1">
              {courses.map(c => (
                <button key={c.id} onClick={() => setSelected(c)} className="w-full text-left p-3 rounded-lg transition-all"
                  style={{
                    background: selected?.id === c.id ? 'rgba(79,142,247,0.15)' : 'transparent',
                    border: `1px solid ${selected?.id === c.id ? 'rgba(79,142,247,0.3)' : 'transparent'}`,
                    color: selected?.id === c.id ? 'var(--accent-blue)' : 'var(--text-secondary)',
                  }}>
                  <p className="text-sm font-semibold">{c.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{(c.classes || []).length} class{(c.classes || []).length !== 1 ? 'es' : ''}</p>
                </button>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Detail */}
        <div className="xl:col-span-3 space-y-5">
          {!selected ? (
            <div className="empty-state glass-card p-12">
              <div className="empty-state-icon"><BookOpen size={28} /></div>
              <h3>Select a course</h3>
            </div>
          ) : detailLoading ? <Loading /> : (
            <>
              {/* Classes in this course */}
              {(selected.classes || []).length > 0 && (
                <SectionCard title="Classes" icon={<BookOpen size={15} style={{ color: 'var(--accent-blue)' }} />}>
                  <div className="space-y-2">
                    {(selected.classes as any[]).map((cls: any) => (
                      <div key={cls.id} className="flex items-center justify-between p-3 rounded-lg"
                        style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{cls.class_name}{cls.section ? ` (${cls.section})` : ''}</p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Teacher: {cls.users?.full_name || 'Unassigned'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              )}

              {/* Materials */}
              <SectionCard title="Materials" icon={<FileText size={15} style={{ color: 'var(--accent-purple)' }} />}>
                {materials.length === 0 ? (
                  <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>No materials uploaded yet</p>
                ) : (
                  <div className="space-y-2">
                    {materials.map(m => (
                      <Link key={m.id} href={`/material-viewer?url=${encodeURIComponent(m.file_url)}&title=${encodeURIComponent(m.title)}`}
                        className="flex items-center justify-between p-3 rounded-lg transition-all"
                        style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.15)', color: 'var(--accent-purple)' }}>
                            <FileText size={14} />
                          </div>
                          <div>
                            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{m.title}</p>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                              {(m.classes as any)?.class_name} · {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        <ChevronRight size={15} style={{ color: 'var(--text-muted)' }} />
                      </Link>
                    ))}
                  </div>
                )}
              </SectionCard>

              {/* Assignments */}
              <SectionCard title="Assignments" icon={<FileText size={15} style={{ color: 'var(--accent-orange)' }} />}>
                {assignments.length === 0 ? (
                  <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>No assignments yet</p>
                ) : (
                  <div className="space-y-3">
                    {assignments.map(a => {
                      const sub = getSubmission(a.id)
                      const isOverdue = new Date(a.due_date) < new Date()
                      return (
                        <div key={a.id} className="p-4 rounded-lg" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{a.title}</p>
                              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{(a.classes as any)?.class_name}</p>
                              <p className={`text-xs mt-1.5 flex items-center gap-1`} style={{ color: isOverdue ? 'var(--accent-red)' : 'var(--text-muted)' }}>
                                <Clock size={10} />
                                Due {formatDistanceToNow(new Date(a.due_date), { addSuffix: true })}
                                {a.max_score && <span className="ml-2">· {a.max_score} pts</span>}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <StatusBadge status={sub ? (sub.status === 'graded' ? 'graded' : 'submitted') : isOverdue ? 'late' : 'scheduled'} />
                              {!sub && (
                                <Link href={`/student/submissions?assignmentId=${a.id}`}>
                                  <Button variant="primary" size="sm">Submit</Button>
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </SectionCard>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
