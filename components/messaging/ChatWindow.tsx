'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Send, MessageCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AvatarWithName } from '@/components/ui/Avatar'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'

interface Message {
  id: string
  content: string
  created_at: string
  sender_id: string
  receiver_id: string
  sender: { id: string; full_name: string; role: string }
}

interface ChatWindowProps {
  currentUserId: string
  recipient: { id: string; full_name: string; role: string }
}

export function ChatWindow({ currentUserId, recipient }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const fetchMessages = useCallback(async () => {
    const res = await fetch(`/api/messages?with=${recipient.id}`)
    const data = await res.json()
    setMessages(data.messages || [])
    setLoading(false)
  }, [recipient.id])

  useEffect(() => {
    fetchMessages()

    // Real-time subscription
    const channel = supabase
      .channel(`messages:${[currentUserId, recipient.id].sort().join('-')}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${currentUserId}`,
      }, (payload) => {
        const msg = payload.new as Message
        if (msg.sender_id === recipient.id) {
          setMessages(prev => [...prev, msg])
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchMessages, currentUserId, recipient.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || sending) return
    const content = input.trim()
    setInput('')
    setSending(true)

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: recipient.id, content }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMessages(prev => [...prev, data.message])
    } catch (err: any) {
      toast.error(err.message || 'Failed to send message')
      setInput(content) // restore
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" style={{ color: 'var(--text-muted)' }}>
        <div className="animate-spin-custom w-5 h-5 border-2 rounded-full mr-3" style={{ borderColor: 'var(--accent-blue)', borderTopColor: 'transparent' }} />
        Loading conversation...
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full" style={{ minHeight: 480 }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
        <AvatarWithName name={recipient.full_name} size="sm" />
        <div className="w-2 h-2 rounded-full ml-auto" style={{ background: 'var(--accent-green)', boxShadow: '0 0 6px var(--accent-green)' }} />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="empty-state h-full">
            <div className="empty-state-icon"><MessageCircle size={28} /></div>
            <h3>No messages yet</h3>
            <p>Start the conversation below</p>
          </div>
        )}
        {messages.map(m => {
          const isMe = m.sender_id === currentUserId
          return (
            <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div style={{ maxWidth: '75%' }}>
                <div className={isMe ? 'chat-bubble-out' : 'chat-bubble-in'}>
                  <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{m.content}</p>
                </div>
                <p className="text-xs mt-1 px-1" style={{ color: 'var(--text-muted)', textAlign: isMe ? 'right' : 'left' }}>
                  {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-end gap-3 px-4 py-4 border-t flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
          placeholder="Type a message… (Enter to send)"
          rows={1}
          className="form-input flex-1"
          style={{ resize: 'none', lineHeight: 1.5 }}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || sending}
          className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all"
          style={{
            background: input.trim() ? 'var(--accent-blue)' : 'var(--bg-hover)',
            color: input.trim() ? '#fff' : 'var(--text-muted)',
            cursor: input.trim() ? 'pointer' : 'not-allowed',
          }}>
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}
