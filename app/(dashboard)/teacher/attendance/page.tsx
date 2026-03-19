'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

export default function TeacherAttendancePage() {
  const [sessions, setSessions] = useState<any[]>([])
  const [selectedSession, setSelectedSession] = useState<string>('')
  const [attendances, setAttendances] = useState<any[]>([])
  const [loadingSessions, setLoadingSessions] = useState(true)
  const [loadingAttendance, setLoadingAttendance] = useState(false)
  const supabase = createClient()

  const fetchSessions = useCallback(async () => {
    setLoadingSessions(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('live_classes')
      .select('id, title, start_time, courses(name, class_id)')
      .eq('teacher_id', user!.id)
      .eq('status', 'ended')
      .order('start_time', { ascending: false })
      .limit(20)
    setSessions(data || [])
    setLoadingSessions(false)
  }, [])

  useEffect(() => { fetchSessions() }, [fetchSessions])

  const fetchAttendance = useCallback(async (sessionId: string) => {
    setLoadingAttendance(true)
    const session = sessions.find(s => s.id === sessionId)
    const classId = (session?.courses as any)?.class_id
    if (!classId) { setAttendances([]); setLoadingAttendance(false); return }

    // Get all students in the class
    const { data: students } = await supabase
      .from('students')
      .select('id, user_id, users(full_name)')
      .eq('class_id', classId)

    // Get attendance records for this session
    const { data: records } = await supabase
      .from('attendance')
      .select('id, student_id, status, join_time, leave_time')
      .eq('live_class_id', sessionId)

    const recordMap: Record<string, any> = {}
    ;(records || []).forEach((r: any) => { recordMap[r.student_id] = r })

    const merged = (students || []).map((stu: any) => ({
      student: stu,
      attendance: recordMap[stu.id] || null,
    }))
    setAttendances(merged)
    setLoadingAttendance(false)
  }, [sessions])

  useEffect(() => { if (selectedSession) fetchAttendance(selectedSession) }, [selectedSession, fetchAttendance])

  const toggleStatus = async (studentId: string, currentStatus: string | null, liveClassId: string) => {
    const newStatus = currentStatus === 'present' ? 'absent' : 'present'
    const existing = attendances.find(a => a.student.id === studentId)?.attendance
    if (existing) {
      await supabase.from('attendance').update({ status: newStatus }).eq('id', existing.id)
    } else {
      await supabase.from('attendance').insert({ student_id: studentId, live_class_id: liveClassId, status: newStatus })
    }
    toast.success(`Marked ${newStatus}`)
    fetchAttendance(liveClassId)
  }

  const card = 'var(--bg-card)'
  const bdr  = '1px solid var(--border)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>✅ Attendance</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: '0.875rem' }}>Auto-recorded on join · Manual override below</p>
      </div>

      <div className="dash-grid-main">
        {/* Session list */}
        <div style={{ background: card, border: bdr, borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: bdr }}>
            <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>Sessions</p>
          </div>
          {loadingSessions ? (
            <p style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>Loading…</p>
          ) : sessions.length === 0 ? (
            <p style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>No ended sessions</p>
          ) : (
            sessions.map(s => (
              <button key={s.id} onClick={() => setSelectedSession(s.id)}
                style={{ width: '100%', textAlign: 'left', padding: '12px 16px', background: selectedSession === s.id ? 'rgba(79,142,247,0.08)' : 'transparent',
                  boxShadow: selectedSession === s.id ? 'inset 3px 0 0 #4f8ef7' : 'none',
                  borderBottom: bdr, border: 'none', cursor: 'pointer' }}>
                <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{s.title}</p>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  {(s.courses as any)?.name} · {s.start_time ? new Date(s.start_time).toLocaleDateString() : '—'}
                </p>
              </button>
            ))
          )}
        </div>

        {/* Attendance table */}
        <div style={{ background: card, border: bdr, borderRadius: 14, padding: 20 }}>
          {!selectedSession ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <p style={{ fontSize: '2rem', marginBottom: 8 }}>👈</p>
              <p style={{ color: 'var(--text-muted)' }}>Select a session to view attendance</p>
            </div>
          ) : loadingAttendance ? (
            <p style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>Loading…</p>
          ) : attendances.length === 0 ? (
            <p style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>No students in this class</p>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                <p style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                  Students ({attendances.filter(a => a.attendance?.status === 'present').length}/{attendances.length} present)
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {attendances.map(({ student, attendance }) => {
                  const status = attendance?.status || null
                  return (
                    <div key={student.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-hover)', borderRadius: 10 }}>
                      <div>
                        <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{student.users?.full_name}</p>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {attendance?.join_time ? `Joined ${new Date(attendance.join_time).toLocaleTimeString()}` : 'Not recorded'}
                        </p>
                      </div>
                      <button onClick={() => toggleStatus(student.id, status, selectedSession)}
                        style={{ padding: '5px 16px', borderRadius: 100, fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', border: 'none',
                          background: status === 'present' ? '#22c55e' : '#ef4444',
                          color: '#fff' }}>
                        {status === 'present' ? '✓ Present' : status === 'absent' ? '✗ Absent' : '— Mark'}
                      </button>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
