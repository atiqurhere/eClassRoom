export const dynamic   = 'force-dynamic'
export const revalidate = 0

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SectionCard } from '@/components/ui/Card'
import { RoleBadge, StatusBadge } from '@/components/ui/Badge'
import { BookOpen, Layers, ClipboardList, CheckSquare, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export default async function AdminStudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: studentId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [studentRes, enrollmentsRes, attendanceRes, submissionsRes] = await Promise.all([
    supabase.from('users').select('*').eq('id', studentId).single(),
    // Get enrolled courses + their classes
    supabase.from('course_enrollments')
      .select('*, course:courses(id, name, classes(id, class_name, section, teacher_id, users!classes_teacher_id_fkey(full_name)))')
      .eq('student_id', studentId)
      .order('enrolled_at'),
    // All attendance for this student (via live_classes → classes)
    supabase.from('attendance')
      .select('*, live_class:live_classes(id, title, class_id, start_time, classes(class_name, course_id, courses(name)))')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(100),
    // All submissions for this student
    supabase.from('submissions')
      .select('*, assignment:assignments(id, title, max_score, due_date, class_id, classes(class_name, course_id, courses(name)))')
      .eq('student_id', studentId)
      .order('submitted_at', { ascending: false })
      .limit(100),
  ])

  const student     = studentRes.data
  const enrollments = (enrollmentsRes.data || []) as any[]
  const attendance  = (attendanceRes.data  || []) as any[]
  const submissions = (submissionsRes.data || []) as any[]

  if (!student) redirect('/admin/users')

  // Course-level stats
  const totalClasses   = enrollments.reduce((sum, e) => sum + (e.course?.classes?.length || 0), 0)
  const totalPresent   = attendance.filter(a => a.status === 'present').length
  const totalAttended  = attendance.length
  const attendancePct  = totalAttended > 0 ? Math.round((totalPresent / totalAttended) * 100) : 0
  const gradedSubs     = submissions.filter(s => s.score != null)
  const avgScore       = gradedSubs.length > 0
    ? Math.round(gradedSubs.reduce((sum, s) => sum + (s.score / (s.assignment?.max_score || 100)) * 100, 0) / gradedSubs.length)
    : null

  const bdr = '1px solid var(--border)'

  return (
    <div className="space-y-5">
      <div className="page-header">
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 4 }}>
          <Link href="/admin/users" style={{ color: 'var(--accent-blue)', textDecoration: 'none' }}>← All Users</Link>
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          {student.avatar_url
            ? <img src={student.avatar_url} style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover' }} alt="" />
            : <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>{student.full_name?.[0]}</div>
          }
          <div>
            <h1 style={{ margin: 0 }}>{student.full_name}</h1>
            <p style={{ margin: 0 }}>{student.email}</p>
          </div>
        </div>
      </div>

      {/* Course-level overview stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(180px,100%),1fr))', gap: 14 }}>
        {[
          { label: 'Enrolled Courses', value: enrollments.length, icon: <BookOpen size={18} />, color: 'var(--accent-blue)' },
          { label: 'Total Classes',    value: totalClasses,       icon: <Layers size={18} />, color: 'var(--accent-purple)' },
          { label: 'Attendance Rate',  value: `${attendancePct}%`, icon: <CheckSquare size={18} />, color: '#22c55e' },
          { label: 'Avg Grade',        value: avgScore != null ? `${avgScore}%` : '—', icon: <TrendingUp size={18} />, color: '#f97316' },
          { label: 'Assignments Done', value: `${submissions.length}`, icon: <ClipboardList size={18} />, color: '#a855f7' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg-card)', border: bdr, borderRadius: 12, padding: '16px 18px' }}>
            <div style={{ color: s.color, marginBottom: 8 }}>{s.icon}</div>
            <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>{s.value}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Per-course breakdown */}
      <SectionCard title="📚 Course Enrolments & Class Breakdown" icon={<BookOpen size={15} />}>
        {enrollments.length === 0 ? (
          <p style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>Not enrolled in any courses.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {enrollments.map((e: any, i: number) => (
              <div key={e.id} style={{ padding: '16px 20px', borderBottom: i < enrollments.length - 1 ? bdr : 'none' }}>
                <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
                  📖 {e.course?.name}
                  <span style={{ marginLeft: 10, fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                    Enrolled {new Date(e.enrolled_at).toLocaleDateString()}
                  </span>
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 16 }}>
                  {(e.course?.classes || []).map((cls: any) => {
                    const classAttendance = attendance.filter(a => a.live_class?.class_id === cls.id)
                    const classPresent    = classAttendance.filter(a => a.status === 'present').length
                    const classAtt        = classAttendance.length
                    const classPct        = classAtt > 0 ? Math.round((classPresent / classAtt) * 100) : null
                    const classSubs       = submissions.filter(s => s.assignment?.class_id === cls.id)
                    return (
                      <div key={cls.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '8px 12px', background: 'var(--bg-hover)', borderRadius: 8, flexWrap: 'wrap' }}>
                        <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem', minWidth: 100 }}>
                          {cls.class_name}{cls.section ? ` (${cls.section})` : ''}
                        </p>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Teacher: {cls.users?.full_name || 'Unassigned'}
                        </span>
                        <div style={{ display: 'flex', gap: 12, marginLeft: 'auto', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.75rem', padding: '2px 8px', background: 'var(--bg-card)', borderRadius: 6, border: bdr }}>
                            🎯 Attend: {classPct != null ? `${classPct}%` : '—'}
                          </span>
                          <span style={{ fontSize: '0.75rem', padding: '2px 8px', background: 'var(--bg-card)', borderRadius: 6, border: bdr }}>
                            📝 Tasks: {classSubs.length}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Attendance history */}
      <SectionCard title="✅ Attendance History" scrollable>
        <table className="data-table">
          <thead><tr><th>Session</th><th>Class</th><th>Course</th><th>Date</th><th>Status</th></tr></thead>
          <tbody>
            {attendance.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>No attendance records</td></tr>
            ) : attendance.map(a => (
              <tr key={a.id}>
                <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{a.live_class?.title}</td>
                <td>{a.live_class?.classes?.class_name || '—'}</td>
                <td>{a.live_class?.classes?.courses?.name || '—'}</td>
                <td>{a.live_class?.start_time ? new Date(a.live_class.start_time).toLocaleDateString() : '—'}</td>
                <td><StatusBadge status={a.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>

      {/* Submissions */}
      <SectionCard title="📝 Assignment Submissions" scrollable>
        <table className="data-table">
          <thead><tr><th>Assignment</th><th>Class</th><th>Course</th><th>Due</th><th>Submitted</th><th>Score</th></tr></thead>
          <tbody>
            {submissions.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>No submissions</td></tr>
            ) : submissions.map(s => (
              <tr key={s.id}>
                <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{s.assignment?.title}</td>
                <td>{s.assignment?.classes?.class_name || '—'}</td>
                <td>{s.assignment?.classes?.courses?.name || '—'}</td>
                <td>{s.assignment?.due_date ? new Date(s.assignment.due_date).toLocaleDateString() : '—'}</td>
                <td>{s.submitted_at ? new Date(s.submitted_at).toLocaleDateString() : '—'}</td>
                <td>
                  {s.score != null
                    ? <span style={{ fontWeight: 700, color: 'var(--accent-blue)' }}>{s.score}/{s.assignment?.max_score}</span>
                    : <span style={{ color: 'var(--text-muted)' }}>Not graded</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>
    </div>
  )
}
