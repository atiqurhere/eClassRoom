'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Check, X, Clock, Download } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Input'
import { SectionCard } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { AvatarWithName } from '@/components/ui/Avatar'
import { Loading } from '@/components/ui/Loading'
import { toast } from 'sonner'

export default function TeacherAttendancePage() {
  const { user } = useAuth()
  const params = useSearchParams()
  const [courses, setCourses] = useState<any[]>([])
  const [sessions, setSessions] = useState<any[]>([])
  const [selectedCourse, setSelectedCourse] = useState(params.get('courseId') || '')
  const [selectedSession, setSelectedSession] = useState('')
  const [attendance, setAttendance] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState<string | null>(null)

  const fetchCourses = useCallback(async () => {
    if (!user) return
    const supabase = createClient()
    const { data } = await supabase.from('courses').select('id, name').eq('teacher_id', user.id)
    setCourses(data || [])
  }, [user])

  const fetchSessions = useCallback(async () => {
    if (!selectedCourse) return
    const supabase = createClient()
    const { data } = await supabase
      .from('live_classes')
      .select('id, title, start_time, status')
      .eq('course_id', selectedCourse)
      .order('start_time', { ascending: false })
    setSessions(data || [])
  }, [selectedCourse])

  const fetchAttendance = useCallback(async () => {
    if (!selectedSession) return
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('attendance')
      .select('id, status, join_time, leave_time, duration_minutes, student_id, students(user_id, student_id, users(full_name, email))')
      .eq('live_class_id', selectedSession)
    setAttendance(data || [])
    setLoading(false)
  }, [selectedSession])

  useEffect(() => { fetchCourses() }, [fetchCourses])
  useEffect(() => { fetchSessions() }, [fetchSessions])
  useEffect(() => { fetchAttendance() }, [fetchAttendance])

  const updateStatus = async (attendanceId: string, newStatus: string) => {
    try {
      setSaving(attendanceId)
      const supabase = createClient()
      const { error } = await supabase
        .from('attendance')
        .update({ status: newStatus })
        .eq('id', attendanceId)
      if (error) throw error
      toast.success(`Marked as ${newStatus}`)
      setAttendance(prev => prev.map(a => a.id === attendanceId ? { ...a, status: newStatus } : a))
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(null)
    }
  }

  const presentCount = attendance.filter(a => a.status === 'present').length
  const absentCount = attendance.filter(a => a.status === 'absent').length
  const rate = attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 0

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1>Attendance Management</h1>
        <p>View and adjust student attendance per session</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div style={{ minWidth: 220 }}>
          <Select
            label="Course"
            placeholder="Select course..."
            options={courses.map(c => ({ value: c.id, label: c.name }))}
            value={selectedCourse}
            onChange={e => { setSelectedCourse(e.target.value); setSelectedSession(''); setAttendance([]) }}
          />
        </div>
        {sessions.length > 0 && (
          <div style={{ minWidth: 260 }}>
            <Select
              label="Session"
              placeholder="Select session..."
              options={sessions.map(s => ({ value: s.id, label: `${s.title} — ${s.start_time ? new Date(s.start_time).toLocaleDateString() : 'Unknown'}` }))}
              value={selectedSession}
              onChange={e => setSelectedSession(e.target.value)}
            />
          </div>
        )}
      </div>

      {selectedSession && (
        <>
          {/* Summary cards */}
          {attendance.length > 0 && (
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Present', value: presentCount, color: 'var(--accent-green)' },
                { label: 'Absent', value: absentCount, color: 'var(--accent-red)' },
                { label: 'Rate', value: `${rate}%`, color: 'var(--accent-blue)' },
              ].map(s => (
                <div key={s.label} className="stat-card text-center">
                  <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
                </div>
              ))}
            </div>
          )}

          <SectionCard
            title={`Attendance — ${attendance.length} students`}
            icon={<Clock size={15} style={{ color: 'var(--text-muted)' }} />}
          >
            {loading ? (
              <Loading text="Loading attendance..." />
            ) : attendance.length === 0 ? (
              <div className="empty-state py-8">
                <div className="empty-state-icon"><Clock size={28} /></div>
                <h3>No attendance records</h3>
                <p>Students who joined this session will appear here.</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr><th>Student</th><th>Student ID</th><th>Join Time</th><th>Duration</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {attendance.map(a => {
                    const stu = a.students as any
                    const u = stu?.users as any
                    return (
                      <tr key={a.id}>
                        <td><AvatarWithName name={u?.full_name} subtitle={u?.email} size="sm" /></td>
                        <td className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{stu?.student_id}</td>
                        <td className="text-xs">{a.join_time ? new Date(a.join_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                        <td className="text-xs">{a.duration_minutes ? `${a.duration_minutes}min` : '—'}</td>
                        <td><StatusBadge status={a.status} /></td>
                        <td>
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => updateStatus(a.id, 'present')}
                              disabled={saving === a.id || a.status === 'present'}
                              className="p-1.5 rounded-lg transition-colors disabled:opacity-40"
                              style={{ color: 'var(--accent-green)', background: 'rgba(34,197,94,0.1)' }}
                              title="Mark Present">
                              <Check size={13} />
                            </button>
                            <button
                              onClick={() => updateStatus(a.id, 'absent')}
                              disabled={saving === a.id || a.status === 'absent'}
                              className="p-1.5 rounded-lg transition-colors disabled:opacity-40"
                              style={{ color: 'var(--accent-red)', background: 'rgba(239,68,68,0.1)' }}
                              title="Mark Absent">
                              <X size={13} />
                            </button>
                            <button
                              onClick={() => updateStatus(a.id, 'late')}
                              disabled={saving === a.id || a.status === 'late'}
                              className="p-1.5 rounded-lg transition-colors disabled:opacity-40"
                              style={{ color: 'var(--accent-orange)', background: 'rgba(245,158,11,0.1)' }}
                              title="Mark Late">
                              <Clock size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </SectionCard>
        </>
      )}
    </div>
  )
}
