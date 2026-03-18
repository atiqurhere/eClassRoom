'use client'

import { useState, useEffect } from 'react'
import { Bell, CheckCheck, MailOpen } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { SectionCard } from '@/components/ui/Card'
import { Loading } from '@/components/ui/Loading'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'

const typeEmoji: Record<string, string> = {
  class_start: '🎥',
  assignment: '📝',
  grade: '📊',
  attendance: '✅',
  announcement: '📢',
  info: '📌',
}

const typeColor: Record<string, string> = {
  class_start: 'var(--accent-green)',
  assignment: 'var(--accent-orange)',
  grade: 'var(--accent-blue)',
  attendance: 'var(--accent-purple)',
  announcement: 'var(--accent-red)',
  info: 'var(--text-muted)',
}

export default function NotificationsPage() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const fetchNotifications = async () => {
    setLoading(true)
    const res = await fetch('/api/notifications')
    const data = await res.json()
    setNotifications(data.notifications || [])
    setLoading(false)
  }

  useEffect(() => { fetchNotifications() }, [])

  const markRead = async (id: string) => {
    await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  const markAllRead = async () => {
    await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ markAll: true }) })
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    toast.success('All marked as read')
  }

  const filtered = filter === 'unread' ? notifications.filter(n => !n.is_read) : notifications
  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="page-header flex items-start justify-between">
        <div>
          <h1>Notifications</h1>
          <p>{unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="secondary" size="sm" leftIcon={<CheckCheck size={15} />} onClick={markAllRead}>
            Mark All Read
          </Button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 rounded-lg w-fit" style={{ background: 'var(--bg-secondary)' }}>
        {(['all', 'unread'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-all"
            style={{
              background: filter === f ? 'var(--bg-card)' : 'transparent',
              color: filter === f ? 'var(--text-primary)' : 'var(--text-muted)',
              border: filter === f ? '1px solid var(--border)' : 'none',
            }}>
            {f} {f === 'unread' && unreadCount > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs" style={{ background: 'var(--accent-blue)', color: 'white' }}>{unreadCount}</span>}
          </button>
        ))}
      </div>

      <SectionCard title={`${filtered.length} notifications`} icon={<Bell size={15} style={{ color: 'var(--accent-blue)' }} />}>
        {loading ? (
          <Loading text="Loading notifications..." />
        ) : filtered.length === 0 ? (
          <div className="empty-state py-12">
            <div className="empty-state-icon"><Bell size={28} /></div>
            <h3>{filter === 'unread' ? 'No unread notifications' : 'No notifications'}</h3>
            <p>You&apos;re all caught up!</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {filtered.map(n => (
              <div key={n.id}
                className="flex items-start gap-4 p-4 transition-all cursor-pointer"
                style={{ background: n.is_read ? 'transparent' : 'rgba(79,142,247,0.05)' }}
                onClick={() => !n.is_read && markRead(n.id)}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{ background: `${typeColor[n.type] || 'var(--text-muted)'}20` }}>
                  {typeEmoji[n.type] || '📌'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-semibold ${!n.is_read ? 'text-primary' : ''}`}
                      style={{ color: n.is_read ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                      {n.title}
                    </p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!n.is_read && (
                        <div className="w-2 h-2 rounded-full" style={{ background: 'var(--accent-blue)' }} />
                      )}
                      <span className="text-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  {n.message && (
                    <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{n.message}</p>
                  )}
                </div>
                {!n.is_read && (
                  <button onClick={(e) => { e.stopPropagation(); markRead(n.id) }}
                    className="p-1.5 rounded-lg flex-shrink-0 transition-colors"
                    style={{ color: 'var(--text-muted)', background: 'var(--bg-hover)' }}
                    title="Mark as read">
                    <MailOpen size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  )
}
