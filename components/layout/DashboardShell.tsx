'use client'

import { useState, useCallback } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'

interface DashboardShellProps {
  role: string
  userName?: string
  userEmail?: string
  children: React.ReactNode
}

export function DashboardShell({ role, userName, userEmail, children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const open  = useCallback(() => setSidebarOpen(true),  [])
  const close = useCallback(() => setSidebarOpen(false), [])

  return (
    <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden', background: 'var(--bg-primary)', position: 'relative' }}>
      {/* Sidebar — drawer on all sizes, slides in on toggle */}
      <Sidebar
        role={role}
        userName={userName}
        userEmail={userEmail}
        open={sidebarOpen}
        onClose={close}
      />

      {/* Main content — full width, no left margin (sidebar is overlay) */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <Header onMenuToggle={open} />
        <main style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: 'clamp(12px, 3vw, 24px)',
          WebkitOverflowScrolling: 'touch',
        }}>
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
