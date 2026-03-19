'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

interface Announcement { id: string; title: string; message: string; created_at: string; class_id: string | null }

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [classes, setClasses] = useState<{ id: string; class_name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [form, setForm] = useState({ title: '', message: '', class_id: '' })
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [aRes, cRes] = await Promise.all([
      supabase.from('notifications').select('id, title, message, created_at, class_id').eq('type', 'announcement').order('created_at', { ascending: false }),
      supabase.from('classes').select('id, class_name').order('class_name'),
    ])
    setAnnouncements((aRes.data || []) as any[])
    setClasses((cRes.data || []) as any[])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.message) { toast.error('Title and message required'); return }
    setSending(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('notifications').insert({
      title: form.title,
      message: form.message,
      type: 'announcement',
      sender_id: user!.id,
      class_id: form.class_id || null,
      target_role: form.class_id ? null : null,
    })
    setSending(false)
    if (error) { toast.error(error.message); return }
    toast.success('Announcement sent!')
    setForm({ title: '', message: '', class_id: '' })
    fetchData()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this announcement?')) return
    await supabase.from('notifications').delete().eq('id', id)
    toast.success('Deleted')
    fetchData()
  }

  const card = 'var(--bg-card)'
  const bdr  = '1px solid var(--border)'
  const inp  = { width: '100%', padding: '9px 12px', background: 'var(--bg-hover)', border: bdr, borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.875rem', boxSizing: 'border-box' as const }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>📢 Announcements</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: '0.875rem' }}>Send announcements to all users or specific classes</p>
      </div>

      <div className="dash-grid-sidebar">
        {/* Compose */}
        <div style={{ background: card, border: bdr, borderRadius: 14, padding: 20 }}>
          <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>✍️ New Announcement</p>
          <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Target (leave blank = everyone)</label>
              <select value={form.class_id} onChange={e => setForm(p => ({ ...p, class_id: e.target.value }))} style={inp}>
                <option value="">📣 All Users (Global)</option>
                {classes.map(c => <option key={c.id} value={c.id}>🏫 {c.class_name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Title *</label>
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required placeholder="Important notice…" style={inp} />
            </div>
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Message *</label>
              <textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} required rows={4}
                placeholder="Write announcement here…"
                style={{ ...inp, resize: 'vertical' as const }} />
            </div>
            <button type="submit" disabled={sending}
              style={{ padding: '10px', background: sending ? '#666' : 'linear-gradient(135deg,#ef4444,#f97316)', color: '#fff', border: 'none', borderRadius: 9, fontWeight: 700, cursor: sending ? 'not-allowed' : 'pointer' }}>
              {sending ? 'Sending…' : '📢 Send Announcement'}
            </button>
          </form>
        </div>

        {/* Past Announcements */}
        <div style={{ background: card, border: bdr, borderRadius: 14, padding: 20 }}>
          <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>📋 Past Announcements ({announcements.length})</p>
          {loading ? <p style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>Loading…</p>
          : announcements.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 0' }}>
              <p style={{ fontSize: '2rem', marginBottom: 8 }}>📭</p>
              <p style={{ color: 'var(--text-muted)' }}>No announcements yet</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {announcements.map(a => (
                <div key={a.id} style={{ padding: '14px 16px', background: 'var(--bg-hover)', borderRadius: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{a.title}</p>
                        <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: 100, background: a.class_id ? '#4f8ef718' : '#f9731618', color: a.class_id ? '#4f8ef7' : '#f97316', fontWeight: 700 }}>
                          {a.class_id ? `Class-specific` : 'Global'}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 6 }}>{a.message}</p>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(a.created_at).toLocaleString()}</p>
                    </div>
                    <button onClick={() => handleDelete(a.id)}
                      style={{ padding: '4px 10px', background: '#ef444418', color: '#ef4444', border: '1px solid #ef444430', borderRadius: 6, fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer', flexShrink: 0, marginLeft: 12 }}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
