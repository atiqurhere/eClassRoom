export const dynamic   = 'force-dynamic'
export const revalidate = 0

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SectionCard } from '@/components/ui/Card'
import { MessageCircle, AlertTriangle } from 'lucide-react'

export default async function AdminChatMonitorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get all messages with sender + receiver info, ordered by most recent
  const { data: messages } = await supabase
    .from('messages')
    .select('*, sender:users!messages_sender_id_fkey(id, full_name, role, avatar_url), receiver:users!messages_receiver_id_fkey(id, full_name, role, avatar_url)')
    .order('created_at', { ascending: false })
    .limit(500)

  const all = (messages || []) as any[]

  // Build conversation threads (unique sender+receiver pairs)
  const threadMap = new Map<string, any>()
  for (const msg of all) {
    const key = [msg.sender_id, msg.receiver_id].sort().join('|')
    if (!threadMap.has(key)) {
      threadMap.set(key, {
        key,
        participants: [msg.sender, msg.receiver],
        lastMessage: msg,
        messages: [],
        hasFlagged: false,
      })
    }
    const thread = threadMap.get(key)!
    thread.messages.push(msg)
    if (msg.is_flagged) thread.hasFlagged = true
  }

  const threads = Array.from(threadMap.values())
  const flaggedCount = threads.filter(t => t.hasFlagged).length

  const bdr = '1px solid var(--border)'

  return (
    <div className="space-y-5">
      <div className="page-header">
        <h1>💬 Chat Monitor</h1>
        <p>View all message threads. Flagged messages contain potentially sensitive personal information.</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(200px,100%), 1fr))', gap: 14 }}>
        {[
          { label: 'Total Threads',    value: threads.length,      color: 'var(--accent-blue)' },
          { label: 'Flagged Threads',  value: flaggedCount,         color: '#ef4444' },
          { label: 'Total Messages',   value: all.length,           color: 'var(--accent-green)' },
          { label: 'Flagged Messages', value: all.filter(m => m.is_flagged).length, color: '#f97316' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg-card)', border: bdr, borderRadius: 12, padding: '16px 20px' }}>
            <p style={{ fontSize: '1.75rem', fontWeight: 800, color: s.color }}>{s.value}</p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Thread list + messages */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,340px) 1fr', gap: 16, alignItems: 'start' }}>
        {/* Thread List */}
        <SectionCard title="Conversations" icon={<MessageCircle size={15} />} scrollable>
          {threads.length === 0 ? (
            <p style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>No messages yet</p>
          ) : (
            <div>
              {threads.map((thread, i) => {
                const [a, b] = thread.participants
                const last   = thread.lastMessage
                return (
                  <div key={thread.key} style={{
                    padding: '12px 16px',
                    borderBottom: i < threads.length - 1 ? bdr : 'none',
                    background: thread.hasFlagged ? 'rgba(239,68,68,0.05)' : 'transparent',
                    borderLeft: thread.hasFlagged ? '3px solid #ef4444' : '3px solid transparent',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                          {a?.full_name} ↔ {b?.full_name}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 1 }}>
                          {a?.role} · {b?.role}
                        </p>
                      </div>
                      {thread.hasFlagged && (
                        <AlertTriangle size={14} style={{ color: '#ef4444', flexShrink: 0 }} />
                      )}
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260 }}>
                      {last.content}
                    </p>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      {new Date(last.created_at).toLocaleString()}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </SectionCard>

        {/* All messages table */}
        <SectionCard title="All Messages" icon={<AlertTriangle size={15} />} scrollable>
          <table className="data-table">
            <thead>
              <tr>
                <th>From</th>
                <th>To</th>
                <th>Message</th>
                <th>Flag</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {all.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>No messages yet</td></tr>
              ) : (
                all.map(msg => (
                  <tr key={msg.id} style={{ background: msg.is_flagged ? 'rgba(239,68,68,0.04)' : 'transparent' }}>
                    <td style={{ fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                      {msg.sender?.full_name}
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>{msg.sender?.role}</span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {msg.receiver?.full_name}
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>{msg.receiver?.role}</span>
                    </td>
                    <td style={{ maxWidth: 320, wordBreak: 'break-word' }}>{msg.content}</td>
                    <td>
                      {msg.is_flagged ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', background: '#ef444420', color: '#ef4444', borderRadius: 100, fontSize: '0.7rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                          <AlertTriangle size={10} /> {msg.flag_reason}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>—</span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(msg.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </SectionCard>
      </div>
    </div>
  )
}
