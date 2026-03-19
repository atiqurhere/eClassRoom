'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { SectionCard } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { SkeletonRow } from '@/components/ui/Loading'
import { Users, CalendarDays, Clock, CheckCircle, XCircle } from 'lucide-react'

export default function TeacherAttendancePage() {
  const [sessions, setSessions]               = useState<any[]>([])
  const [selectedSession, setSelectedSession] = useState<string>('')
  const [attendances, setAttendances]         = useState<any[]>([])
  const [loadingSessions, setLoadingSessions] = useState(true)
  const [loadingAttendance, setLoadingAttendance]= useState(false)

  // Fetch this teacher's ended live sessions (with class + course info)
  const fetchSessions = useCallback(async () => {
    setLoadingSessions(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('live_classes')
      .select('id, title, start_time, class_id, classes(id, class_name, section, course_id, courses(name))')
      .eq('teacher_id', user.id)
      .eq('status', 'ended')
      .order('start_time', { ascending: false })
      .limit(20)
    setSessions(data || [])
    setLoadingSessions(false)
  }, [])

  useEffect(() => { fetchSessions() }, [fetchSessions])

  const fetchAttendance = useCallback(async (sessionId: string) => {
    setLoadingAttendance(true)
    const supabase   = createClient()
    const session    = sessions.find(s => s.id === sessionId)
    const courseId   = (session?.classes as any)?.course_id

    if (!courseId) { setAttendances([]); setLoadingAttendance(false); return }

    // 1. Get enrolled student IDs for this course
    const [enrollRes, recordRes] = await Promise.all([
      supabase
        .from('course_enrollments')
        .select('student_id')
        .eq('course_id', courseId),
      supabase
        .from('attendance')
        .select('id, student_id, status, join_time, leave_time')
        .eq('live_class_id', sessionId),
    ])

    const studentIds = (enrollRes.data || []).map((e: any) => e.student_id)

    // 2. Fetch user names separately (avoids RLS on complex FK joins)
    const userRes = studentIds.length
      ? await supabase.from('users').select('id, full_name').in('id', studentIds)
      : { data: [] }

    const userMap: Record<string, string> = {}
    ;(userRes.data || []).forEach((u: any) => { userMap[u.id] = u.full_name })

    const recordMap: Record<string, any> = {}
    ;(recordRes.data || []).forEach((r: any) => { recordMap[r.student_id] = r })

    const combined = studentIds.map((sid: string) => ({
      student_id: sid,
      full_name:  userMap[sid] || sid.slice(0, 8) + '…',
      attendance: recordMap[sid] || null,
    }))
    setAttendances(combined)
    setLoadingAttendance(false)
  }, [sessions])


  useEffect(() => { if (selectedSession) fetchAttendance(selectedSession) }, [selectedSession, fetchAttendance])

  const toggleAttendance = async (studentId: string, currentRecord: any) => {
    const supabase  = createClient()
    const newStatus = currentRecord?.status === 'present' ? 'absent' : 'present'
    if (currentRecord) {
      await supabase.from('attendance').update({ status: newStatus }).eq('id', currentRecord.id)
    } else {
      await supabase.from('attendance').insert({
        live_class_id: selectedSession,
        student_id: studentId,
        status: newStatus,
        join_time: newStatus === 'present' ? new Date().toISOString() : null,
      })
    }
    toast.success(`Marked as ${newStatus.toUpperCase()}`)
    fetchAttendance(selectedSession)
  }

  const activeSess = sessions.find(s => s.id === selectedSession)
  const presentCount = attendances.filter(a => a.attendance?.status === 'present').length

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1>Attendance Tracking</h1>
        <p>Review and manually adjust attendance for past live sessions</p>
      </div>

      <div className="dash-grid-sidebar" style={{ alignItems: 'start' }}>
        {/* Left: Session Selection */}
        <SectionCard title="Past Sessions" icon={<CalendarDays size={15} style={{ color: 'var(--accent-blue)' }} />}>
          {loadingSessions ? (
            <div className="p-4 space-y-3">
              <SkeletonRow /><SkeletonRow /><SkeletonRow />
            </div>
          ) : sessions.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>No past sessions found.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {sessions.map(s => (
                <button 
                  key={s.id} 
                  onClick={() => setSelectedSession(s.id)}
                  style={{ 
                    padding: '12px 16px', borderBottom: '1px solid var(--border)', textAlign: 'left',
                    background: selectedSession === s.id ? 'var(--bg-hover)' : 'transparent',
                    borderLeft: selectedSession === s.id ? '3px solid var(--accent-blue)' : '3px solid transparent',
                    cursor: 'pointer', transition: 'all 0.2s', borderRight: 'none', borderTop: 'none'
                  }}
                >
                  <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{s.title}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    {(s.classes as any)?.class_name} · {new Date(s.start_time).toLocaleDateString()}
                  </p>
                </button>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Right: Attendance List */}
        <div>
          {selectedSession ? (
            <SectionCard title={activeSess?.title || 'Attendance Report'} icon={<Users size={15} style={{ color: 'var(--accent-purple)' }} />}>
              <div style={{ padding: '12px 20px', background: 'var(--bg-hover)', borderBottom: '1px solid var(--border)', display: 'flex', gap: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Users size={14} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Enrolled: <b style={{ color: 'var(--text-primary)' }}>{attendances.length}</b></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle size={14} style={{ color: 'var(--accent-green)' }} />
                  <span style={{ fontSize: '0.8125rem', color: 'var(--accent-green)' }}>Present: <b>{presentCount}</b></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <XCircle size={14} style={{ color: 'var(--accent-red)' }} />
                  <span style={{ fontSize: '0.8125rem', color: 'var(--accent-red)' }}>Absent: <b>{attendances.length - presentCount}</b></span>
                </div>
              </div>

              {loadingAttendance ? (
                <table className="data-table"><tbody>{[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}</tbody></table>
              ) : attendances.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                  <Users size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                  <p>No students enrolled in this course.</p>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr><th>Student</th><th>Status</th><th>Join Time</th><th style={{ textAlign: 'right' }}>Action</th></tr>
                  </thead>
                  <tbody>
                    {attendances.map(a => {
                      const isPresent = a.attendance?.status === 'present'
                      return (
                        <tr key={a.student_id}>
                          <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{a.full_name}</td>
                          <td>
                            <span style={{
                              padding: '4px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600,
                              background: isPresent ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                              color: isPresent ? 'var(--accent-green)' : 'var(--accent-red)'
                            }}>
                              {isPresent ? 'PRESENT' : 'ABSENT'}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                            {isPresent && a.attendance?.join_time ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Clock size={12} /> {new Date(a.attendance.join_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            ) : '—'}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <Button 
                              variant={isPresent ? 'secondary' : 'primary'} 
                              size="sm" 
                              onClick={() => toggleAttendance(a.student_id, a.attendance)}
                            >
                              {isPresent ? 'Mark Absent' : 'Mark Present'}
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </SectionCard>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16 }}>
              <CalendarDays size={40} style={{ margin: '0 auto 16px', color: 'var(--accent-blue)', opacity: 0.5 }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>Select a Session</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Choose a past live class from the left to view and edit student attendance records.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
