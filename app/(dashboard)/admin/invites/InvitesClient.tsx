'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Plus, Copy, CheckCircle, Clock, Users, GraduationCap, Trash2, RefreshCw } from 'lucide-react'

interface StudentInvite {
  id: string; student_code: string; full_name: string; class_id: string | null
  shift: string | null; user_id: string | null; claimed_at: string | null; created_at: string
}
interface TeacherInvite {
  id: string; teacher_code: string; full_name: string
  user_id: string | null; claimed_at: string | null; created_at: string
}
interface ClassItem { id: string; class_name: string; section: string | null }

interface Props {
  studentInvites: StudentInvite[]
  teacherInvites: TeacherInvite[]
  classes: ClassItem[]
  adminId: string
}

function generateCode(prefix: string) {
  const year = new Date().getFullYear()
  const rand = Math.floor(1000 + Math.random() * 9000)
  return `${prefix}-${year}-${rand}`
}

export default function InvitesClient({ studentInvites: initialStudents, teacherInvites: initialTeachers, classes, adminId }: Props) {
  const supabase = createClient()
  const [tab, setTab]                   = useState<'students' | 'teachers'>('students')
  const [students, setStudents]         = useState(initialStudents)
  const [teachers, setTeachers]         = useState(initialTeachers)
  const [showModal, setShowModal]       = useState(false)
  const [loading, setLoading]           = useState(false)
  const [refreshing, setRefreshing]     = useState(false)
  const [copied, setCopied]             = useState<string | null>(null)

  const refreshData = async () => {
    setRefreshing(true)
    try {
      const [sRes, tRes] = await Promise.all([
        supabase.from('student_invites').select('*').order('created_at', { ascending: false }),
        supabase.from('teacher_invites').select('*').order('created_at', { ascending: false }),
      ])
      if (sRes.data) setStudents(sRes.data as StudentInvite[])
      if (tRes.data) setTeachers(tRes.data as TeacherInvite[])
    } catch {}
    setRefreshing(false)
  }

  // Student form
  const [sName, setSName]   = useState('')
  const [sClass, setSClass] = useState('')
  const [sShift, setSShift] = useState('morning')
  // Teacher form
  const [tName, setTName] = useState('')

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
    toast.success('Copied to clipboard!')
  }

  const handleGenerateStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sName.trim()) return
    setLoading(true)
    try {
      const code = generateCode('LQA')
      const { data, error } = await supabase.from('student_invites').insert({
        student_code: code, full_name: sName.trim(),
        class_id: sClass || null, shift: sShift, created_by: adminId,
      }).select().single()
      if (error) throw error
      setStudents(prev => [data, ...prev])
      setSName(''); setSClass(''); setSShift('morning')
      setShowModal(false)
      toast.success(`Student ID generated: ${code}`)
    } catch (err: any) { toast.error(err.message) } finally { setLoading(false) }
  }

  const handleGenerateTeacher = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tName.trim()) return
    setLoading(true)
    try {
      const code = generateCode('LQA-TCH')
      const { data, error } = await supabase.from('teacher_invites').insert({
        teacher_code: code, full_name: tName.trim(), created_by: adminId,
      }).select().single()
      if (error) throw error
      setTeachers(prev => [data, ...prev])
      setTName('')
      setShowModal(false)
      toast.success(`Teacher ID generated: ${code}`)
    } catch (err: any) { toast.error(err.message) } finally { setLoading(false) }
  }

  const handleDelete = async (table: 'student_invites' | 'teacher_invites', id: string, codeType: string) => {
    if (!confirm('Delete this invite? The user will lose access if already claimed.')) return
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) { toast.error(error.message); return }
    if (table === 'student_invites') setStudents(prev => prev.filter(s => s.id !== id))
    else setTeachers(prev => prev.filter(t => t.id !== id))
    toast.success('Invite deleted.')
  }

  const card = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 20px' }
  const badge = (claimed: boolean) => ({
    padding: '3px 10px', borderRadius: 100, fontSize: '0.7rem', fontWeight: 600,
    background: claimed ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)',
    color: claimed ? 'var(--accent-green)' : '#f59e0b',
  })

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>Invites & IDs</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Generate student and teacher IDs for account registration
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'var(--accent-blue)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}
        >
          <Plus size={16} /> Generate ID
        </button>
        <button
          onClick={refreshData}
          disabled={refreshing}
          title="Refresh status"
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', background: 'var(--bg-hover)', border: '1px solid var(--border)', color: 'var(--text-secondary)', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Total Students', value: students.length, icon: <GraduationCap size={20} />, color: 'var(--accent-blue)' },
          { label: 'Claimed', value: students.filter(s => s.user_id).length, icon: <CheckCircle size={20} />, color: '#22c55e' },
          { label: 'Pending', value: students.filter(s => !s.user_id).length, icon: <Clock size={20} />, color: '#f59e0b' },
          { label: 'Teachers', value: teachers.length, icon: <Users size={20} />, color: 'var(--accent-red)' },
        ].map(s => (
          <div key={s.label} style={card}>
            <div style={{ color: s.color, marginBottom: 8 }}>{s.icon}</div>
            <p style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>{s.value}</p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, padding: 4, background: 'var(--bg-secondary)', borderRadius: 10, marginBottom: 20, width: 'fit-content' }}>
        {(['students', 'teachers'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600,
            fontSize: '0.875rem', transition: 'all 0.15s',
            background: tab === t ? 'var(--bg-card)' : 'transparent',
            color: tab === t ? 'var(--text-primary)' : 'var(--text-muted)',
          }}>
            {t === 'students' ? `👨‍🎓 Students (${students.length})` : `👩‍🏫 Teachers (${teachers.length})`}
          </button>
        ))}
      </div>

      {/* Students Table */}
      {tab === 'students' && (
        <div style={{ ...card, padding: 0, borderRadius: 14, overflow: 'hidden' }}>
          {students.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
              <GraduationCap size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
              <p style={{ fontWeight: 600 }}>No student IDs yet</p>
              <p style={{ fontSize: '0.875rem', marginTop: 4 }}>Generate your first student ID above.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', minWidth: 560 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Student ID', 'Name', 'Class', 'Shift', 'Status', ''].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <code style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent-blue)' }}>{s.student_code}</code>
                        <button onClick={() => copyCode(s.student_code)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}>
                          {copied === s.student_code ? <CheckCircle size={14} style={{ color: '#22c55e' }} /> : <Copy size={14} />}
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-primary)', fontWeight: 500 }}>{s.full_name}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                      {classes.find(c => c.id === s.class_id)?.class_name ?? '—'}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{s.shift ?? '—'}</td>
                    <td style={{ padding: '12px 16px' }}><span style={badge(!!s.user_id)}>{s.user_id ? 'Claimed' : 'Pending'}</span></td>
                    <td style={{ padding: '12px 16px' }}>
                      {!s.user_id && (
                        <button onClick={() => handleDelete('student_invites', s.id, s.student_code)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-red)' }}>
                          <Trash2 size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Teachers Table */}
      {tab === 'teachers' && (
        <div style={{ ...card, padding: 0, borderRadius: 14, overflow: 'hidden' }}>
          {teachers.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
              <Users size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
              <p style={{ fontWeight: 600 }}>No teacher IDs yet</p>
              <p style={{ fontSize: '0.875rem', marginTop: 4 }}>Generate your first teacher ID above.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', minWidth: 480 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Teacher ID', 'Name', 'Status', 'Claimed At', ''].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {teachers.map(t => (
                  <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <code style={{ fontFamily: 'monospace', fontWeight: 700, color: '#22c55e' }}>{t.teacher_code}</code>
                        <button onClick={() => copyCode(t.teacher_code)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}>
                          {copied === t.teacher_code ? <CheckCircle size={14} style={{ color: '#22c55e' }} /> : <Copy size={14} />}
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 500, color: 'var(--text-primary)' }}>{t.full_name}</td>
                    <td style={{ padding: '12px 16px' }}><span style={badge(!!t.user_id)}>{t.user_id ? 'Claimed' : 'Pending'}</span></td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                      {t.claimed_at ? new Date(t.claimed_at).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {!t.user_id && (
                        <button onClick={() => handleDelete('teacher_invites', t.id, t.teacher_code)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-red)' }}>
                          <Trash2 size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Generate Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 18, padding: 32, width: '100%', maxWidth: 480, margin: '0 16px' }}>
            {/* Modal tab */}
            <div style={{ display: 'flex', gap: 4, padding: 4, background: 'var(--bg-secondary)', borderRadius: 8, marginBottom: 24 }}>
              {(['students', 'teachers'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)} style={{
                  flex: 1, padding: '8px', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: '0.8125rem',
                  background: tab === t ? 'var(--bg-hover)' : 'transparent',
                  color: tab === t ? 'var(--text-primary)' : 'var(--text-muted)',
                }}>
                  {t === 'students' ? '👨‍🎓 Student' : '👩‍🏫 Teacher'}
                </button>
              ))}
            </div>

            {tab === 'students' ? (
              <form onSubmit={handleGenerateStudent} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <h2 style={{ fontWeight: 700, fontSize: '1.125rem', color: 'var(--text-primary)' }}>Generate Student ID</h2>
                {[
                  { label: 'Full Name', value: sName, onChange: (v: string) => setSName(v), placeholder: "Student's full name", required: true },
                ].map(f => (
                  <div key={f.label}>
                    <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>{f.label}</label>
                    <input value={f.value} onChange={e => f.onChange(e.target.value)} placeholder={f.placeholder} required={f.required}
                      style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none' }} />
                  </div>
                ))}
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Class</label>
                  <select value={sClass} onChange={e => setSClass(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none' }}>
                    <option value="">— No class assigned —</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}{c.section ? ` (${c.section})` : ''}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Shift</label>
                  <select value={sShift} onChange={e => setSShift(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none' }}>
                    <option value="morning">🌅 Morning</option>
                    <option value="afternoon">☀️ Afternoon</option>
                    <option value="evening">🌙 Evening</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" disabled={loading} style={{ flex: 2, padding: '10px', background: 'var(--accent-blue)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
                    {loading ? 'Generating…' : 'Generate Student ID'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleGenerateTeacher} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <h2 style={{ fontWeight: 700, fontSize: '1.125rem', color: 'var(--text-primary)' }}>Generate Teacher ID</h2>
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Full Name</label>
                  <input value={tName} onChange={e => setTName(e.target.value)} placeholder="Teacher's full name" required
                    style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" disabled={loading} style={{ flex: 2, padding: '10px', background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
                    {loading ? 'Generating…' : 'Generate Teacher ID'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
