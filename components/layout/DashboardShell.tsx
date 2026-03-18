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
  const [mobileOpen, setMobileOpen] = useState(false)
  const open  = useCallback(() => setMobileOpen(true),  [])
  const close = useCallback(() => setMobileOpen(false), [])

  return (
    <div className="dashboard-shell">
      <Sidebar
        role={role}
        userName={userName}
        userEmail={userEmail}
        mobileOpen={mobileOpen}
        onClose={close}
      />
      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div className="sidebar-backdrop" onClick={close} />
      )}
      <div className="dashboard-content">
        <Header onMenuToggle={open} />
        <main className="dashboard-main">
          <div className="dashboard-inner">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
