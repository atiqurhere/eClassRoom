'use client'

import { Search, Menu } from 'lucide-react'
import { NotificationBell } from '@/components/notifications/NotificationBell'

interface HeaderProps {
  title?: string
  subtitle?: string
  onMenuToggle?: () => void
}

export function Header({ title, subtitle, onMenuToggle }: HeaderProps) {
  return (
    <header className="flex-shrink-0 flex items-center justify-between px-6 h-16"
      style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
      {/* Left: mobile menu + title */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="p-2 rounded-lg transition-colors lg:hidden"
          style={{ color: 'var(--text-muted)', background: 'var(--bg-hover)' }}
        >
          <Menu size={18} />
        </button>
        {title && (
          <div>
            <h1 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h1>
            {subtitle && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>}
          </div>
        )}
      </div>

      {/* Right: search + notifications */}
      <div className="flex items-center gap-3">
        <div className="relative hidden md:block">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search..."
            className="form-input pl-9 py-2 text-sm"
            style={{ width: 220, padding: '8px 12px 8px 36px', fontSize: '0.8125rem' }}
          />
        </div>
        <NotificationBell />
      </div>
    </header>
  )
}
