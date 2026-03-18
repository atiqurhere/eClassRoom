'use client'

import { useState, useEffect } from 'react'
import { MessageCircle, Search, Users, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ChatWindow } from '@/components/messaging/ChatWindow'
import { Loading } from '@/components/ui/Loading'

interface Contact {
  id: string
  full_name: string
  role: string
  email: string
}

export default function MessagesPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [selected, setSelected] = useState<Contact | null>(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setCurrentUserId(user.id)
      const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
      let query = supabase.from('users').select('id, full_name, role, email').neq('id', user.id)
      if (profile?.role === 'student') query = query.in('role', ['teacher', 'admin'])
      const { data } = await query.order('full_name')
      setContacts(data || [])
      setLoading(false)
    }
    init()
  }, [])

  const roleLabel: Record<string, string> = { admin: '👑 Admin', teacher: '👩‍🏫 Teacher', student: '👨‍🎓 Student' }
  const roleColor: Record<string, string> = { admin: 'var(--accent-red)', teacher: 'var(--accent-blue)', student: 'var(--accent-green)' }
  const filtered = contacts.filter(c => !search || c.full_name.toLowerCase().includes(search.toLowerCase()) || c.role.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="chat-shell">
      {/* ── Contacts panel ── */}
      <div className={`chat-contacts${selected ? ' chat-contacts--hidden' : ''}`}>
        <div style={{ padding: '16px 14px 12px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <MessageCircle size={16} style={{ color: 'var(--accent-blue)' }} /> Messages
          </h2>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input type="text" placeholder="Search contacts..." value={search} onChange={e => setSearch(e.target.value)}
              className="form-input" style={{ paddingLeft: 30, fontSize: '0.8125rem' }} />
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <Loading text="Loading contacts..." />
          ) : filtered.length === 0 ? (
            <div className="empty-state py-8">
              <div className="empty-state-icon"><Users size={24} /></div>
              <h3>No contacts</h3><p>No users found</p>
            </div>
          ) : (
            filtered.map(c => (
              <button key={c.id} onClick={() => setSelected(c)} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px', cursor: 'pointer', textAlign: 'left',
                transition: 'all 0.15s ease', border: 'none', borderBottom: '1px solid var(--border)',
                background: selected?.id === c.id ? 'rgba(79,142,247,0.1)' : 'transparent',
                boxShadow: selected?.id === c.id ? 'inset 3px 0 0 var(--accent-blue)' : 'none',
              }}>
                <div className="avatar" style={{ width: 38, height: 38, fontSize: '0.875rem', flexShrink: 0, background: `${roleColor[c.role]}20`, color: roleColor[c.role] }}>
                  {c.full_name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.full_name}</p>
                  <p style={{ fontSize: '0.75rem', color: roleColor[c.role] }}>{roleLabel[c.role]}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── Chat panel ── */}
      <div className={`chat-window-panel${selected ? ' chat-window-panel--visible' : ''}`}>
        {/* Mobile back button */}
        {selected && (
          <div className="chat-mobile-back" onClick={() => setSelected(null)}>
            <ArrowLeft size={18} />
            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{selected.full_name}</span>
            <span style={{ fontSize: '0.75rem', color: roleColor[selected.role], marginLeft: 4 }}>{roleLabel[selected.role]}</span>
          </div>
        )}
        {selected && currentUserId ? (
          <ChatWindow currentUserId={currentUserId} recipient={selected} />
        ) : (
          <div className="empty-state" style={{ flex: 1 }}>
            <div className="empty-state-icon"><MessageCircle size={32} /></div>
            <h3>Select a conversation</h3>
            <p>Choose a contact from the left to start messaging</p>
          </div>
        )}
      </div>
    </div>
  )
}
