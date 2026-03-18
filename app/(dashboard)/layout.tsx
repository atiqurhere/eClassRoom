'use client'

import { ReactNode } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { Loading } from '@/components/ui/Loading'
import { useAuth } from '@/lib/hooks/useAuth'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <Loading fullPage text="Loading your workspace..." size="lg" />
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      <Sidebar
        role={user?.role || 'student'}
        userName={user?.full_name}
        userEmail={user?.email}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
