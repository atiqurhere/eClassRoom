'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

export default function TeacherAttendancePage() {
  const [sessions, setSessions]             = useState<any[]>([])
  const [selectedSession, setSelectedSession] = useState<string>('')
  const [attendances, setAttendances]       = useState<any[]>([])
  const [loadingSessions, setLoadingSessions] = useState(true)
  const [loadingAttendance, setLoadingAttendance] = useState(false)
  const supabase = createClient()

  // Fetch this teacher's ended live sessions (with class + course info)
  const fetchSessions = useCallback(async () => {
    setLoadingSessions(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('live_classes')
      .select('id, title, start_time, class_id, classes(id, class_name, section, course_id, courses(name))')
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
    const classId   = session?.class_id
    const courseId  = (session?.classes as any)?.course_id

    if (!classId || !courseId) { setAttendances([]); setLoadingAttendance(false); return }

    // In v2: students are enrolled in courses via course_enrollments
    // Get all users enrolled in the course for this class
    const [enrollRes, recordRes] = await Promise.all([
      supabase
        .from('course_enrollments')
        .select('student_id, users!course_enrollments_student_id_fkey(id, full_name)')
        .eq('course_id', courseId),
      supabase
        .from('attendance')
        .select('id, student_id, status, join_time, leave_time')
        .eq('live_class_id', sessionId),
    ])

    const recordMap: Record<string, any> = {}
    ;(recordRes.data || []).forEach((r: any) => { recordMap[r.student_id] = r })

    const combined = (enrollRes.data || []).map((e: any) => ({
      student_id:  e.student_id,
      full_name:   e.users?.full_name || 'Unknown',
      attendance:  recordMap[e.student_id] || null,
    }))
    setAttendances(combined)
    setLoadingAttendance(false)
  }, [sessions])

  const markAttendance = async (studentId: string, status: 'present' | 'absent' | 'late') => {
    const existing = attendances.find(a => a.student_id === studentId)?.attendance
    if (existing) {
      await supabase.from('attendance').update({ status }).eq('id', existing.id)
    } else {
      await supabase.from('attendance').insert({ live_class_id: selectedSession, student_id: studentId, status })
    }
    toast.success(`Marked ${status}`)
    fetchAttendance(selectedSession)
  }

  const card = 'var(--bg-card)'
  const bdr  = '1px solid var(--border)'

  const statusColor = (s?: string) => s === 'present' ? '#22c55e' : s === 'absent' ? '#ef4444' : s === 'late' ? '#f59e0b' : 'var(--text-muted)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>✅ Attendance</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: '0.875rem' }}>Mark attendance for completed live sessions</p>
      </div>

      {/* Session Selector */}
      <div style={{ background: card, border: bdr, borderRadius: 14, padding: 20 }}>
        <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>Select Session</p>
        {loadingSessions ? (
          <p style={{ color: 'var(--text-muted)' }}>Loading sessions…</p>
        ) : sessions.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No ended sessions found.</p>
        ) : (
          <select value={selectedSession} className="form-input"
            onChange={e => { setSelectedSession(e.target.value); if (e.target.value) fetchAttendance(e.target.value) }}>
            <option value="">— Select a session —</option>
            {sessions.map(s => (
              <option key={s.id} value={s.id}>
                {s.title} · {(s.classes as any)?.class_name} · {new Date(s.start_time).toLocaleDateString()}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Attendance Table */}
      {selectedSession && (
        <div style={{ background: card, border: bdr, borderRadius: 14, padding: 20 }}>
          <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>
            Students ({attendances.length})
          </p>
          {loadingAttendance ? (
            <p style={{ color: 'var(--text-muted)' }}>Loading…</p>
          ) : attendances.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No students enrolled in this course.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>Student</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {attendances.map(a => (
                  <tr key={a.student_id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{a.full_name}</td>
                    <td>
                      <span style={{ fontWeight: 700, color: statusColor(a.attendance?.status), textTransform: 'capitalize' }}>
                        {a.attendance?.status || '—'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {(['present', 'late', 'absent'] as const).map(s => (
                          <button key={s} onClick={() => markAttendance(a.student_id, s)}
                            style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${statusColor(s)}40`, background: a.attendance?.status === s ? `${statusColor(s)}20` : 'transparent', color: statusColor(s), fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer', textTransform: 'capitalize' }}>
                            {s}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
