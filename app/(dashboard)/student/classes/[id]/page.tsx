'use client'

import { useState, useEffect, useCallback } from 'react'
import { FileText, Download, Calendar, CheckCircle, Clock, BookOpen, Award } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { SectionCard } from '@/components/ui/Card'
import { SubmissionForm } from '@/components/assignments/SubmissionForm'
import { Loading } from '@/components/ui/Loading'
import { useParams } from 'next/navigation'
import { proxyFileUrl } from '@/lib/utils/proxyUrl'

export default function StudentClassDetailPage() {
  const params = useParams()
  const courseId = params.id as string

  const [course, setCourse] = useState<any>(null)
  const [assignments, setAssignments] = useState<any[]>([])
  const [materials, setMaterials] = useState<any[]>([])
  const [showSubmit, setShowSubmit] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [studentId, setStudentId] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setStudentId(user.id)

    const [courseRes, assignRes, matsRes] = await Promise.all([
      supabase.from('courses').select('*, classes(class_name, section), users!courses_teacher_id_fkey(full_name)').eq('id', courseId).single(),
      supabase.from('assignments')
        .select('*, submissions!left(id, score, feedback, content, file_url, created_at, student_id)')
        .eq('course_id', courseId)
        .order('due_date'),
      supabase.from('course_materials').select('*').eq('course_id', courseId).order('created_at', { ascending: false }),
    ])
    setCourse(courseRes.data)
    // Filter submissions for this student
    const asgns = (assignRes.data || []).map((a: any) => ({
      ...a,
      mySubmission: (a.submissions || []).find((s: any) => s.student_id === user.id) || null,
    }))
    setAssignments(asgns)
    setMaterials(matsRes.data || [])
    setLoading(false)
  }, [courseId])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) return <Loading text="Loading course..." />

  const courseName = course?.name || 'Course'
  const teacherName = (course?.users as any)?.full_name || 'Unassigned'
  const className = course?.classes ? `${course.classes.class_name}${course.classes.section ? ' — ' + course.classes.section : ''}` : ''

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1>{courseName}</h1>
        <p>{className} · Teacher: {teacherName}</p>
      </div>

      {/* Assignments */}
      <SectionCard title={`Assignments (${assignments.length})`} icon={<BookOpen size={15} style={{ color: 'var(--accent-blue)' }} />}>
        {assignments.length === 0 ? (
          <div className="empty-state py-8">
            <div className="empty-state-icon"><BookOpen size={24} /></div>
            <h3>No assignments yet</h3>
            <p>Your teacher hasn&apos;t posted any assignments yet</p>
          </div>
        ) : (
          <div className="space-y-3 p-4">
            {assignments.map(a => {
              const isOverdue = new Date() > new Date(a.due_date)
              const sub = a.mySubmission
              const isShowing = showSubmit === a.id

              return (
                <div key={a.id} className="glass-card p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{a.title}</p>
                    <div className="flex-shrink-0">
                      {sub ? (
                        <span className="badge badge-green"><CheckCircle size={11} className="mr-1" />Submitted</span>
                      ) : isOverdue ? (
                        <span className="badge badge-red"><Clock size={11} className="mr-1" />Overdue</span>
                      ) : (
                        <span className="badge badge-orange">Pending</span>
                      )}
                    </div>
                  </div>

                  {a.description && (
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{a.description}</p>
                  )}

                  <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--text-muted)' }}>
                    <span style={{ color: isOverdue && !sub ? 'var(--accent-red)' : undefined }}>
                      <Calendar size={13} className="inline mr-1" />
                      Due {new Date(a.due_date).toLocaleDateString()}
                    </span>
                    <span><Award size={13} className="inline mr-1" />{a.max_score} pts</span>
                  </div>

                  {/* Grade + feedback */}
                  {sub?.score !== null && sub?.score !== undefined && (
                    <div className="rounded-lg p-3 space-y-1" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
                      <p className="text-sm font-semibold" style={{ color: 'var(--accent-green)' }}>
                        Score: {sub.score}/{a.max_score} ({Math.round((sub.score / a.max_score) * 100)}%)
                      </p>
                      {sub.feedback && (
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          <span className="font-medium" style={{ color: 'var(--accent-blue)' }}>Feedback: </span>
                          {sub.feedback}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    {!sub && !isOverdue && (
                      <Button size="sm" variant={isShowing ? 'secondary' : 'gradient'}
                        onClick={() => setShowSubmit(isShowing ? null : a.id)}>
                        {isShowing ? 'Cancel' : 'Submit Assignment'}
                      </Button>
                    )}
                    {sub && !sub.score && (
                      <span className="text-xs" style={{ color: 'var(--text-muted)', alignSelf: 'center' }}>
                        Awaiting grade...
                      </span>
                    )}
                  </div>

                  {isShowing && studentId && (
                    <div className="pt-1 border-t" style={{ borderColor: 'var(--border)' }}>
                      <SubmissionForm
                        assignmentId={a.id}
                        assignmentTitle={a.title}
                        dueDate={a.due_date}
                        maxScore={a.max_score}
                        onSuccess={() => { setShowSubmit(null); fetchData() }}
                      />
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
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {new Date(m.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {m.file_url && (
                  <a href={proxyFileUrl(m.file_url, m.title)} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="ghost"><Download size={14} /></Button>
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  )
}