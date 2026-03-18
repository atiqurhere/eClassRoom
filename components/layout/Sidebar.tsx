'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, BookOpen, Video,
  FileText, BarChart2, Settings, LogOut,
  ChevronRight, ClipboardList, BookMarked,
  Monitor, Bell, MessageCircle, UserPlus,
  Megaphone, CalendarDays, FolderOpen, PlayCircle, X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

const adminNav = [
  { label: 'Dashboard',       href: '/admin/dashboard',       icon: <LayoutDashboard size={18} /> },
  { label: 'Users',           href: '/admin/users',           icon: <Users size={18} /> },
  { label: 'Invites',         href: '/admin/invites',         icon: <UserPlus size={18} /> },
  { label: 'Classes',         href: '/admin/classes',         icon: <BookOpen size={18} /> },
  { label: 'Assign Students', href: '/admin/assign-students', icon: <Users size={18} /> },
  { label: 'Schedule',        href: '/admin/schedule',        icon: <CalendarDays size={18} /> },
  { label: 'Announcements',   href: '/admin/announcements',   icon: <Megaphone size={18} /> },
  { label: 'Monitoring',      href: '/admin/monitoring',      icon: <Monitor size={18} /> },
  { label: 'Reports',         href: '/admin/reports',         icon: <BarChart2 size={18} /> },
]
const teacherNav = [
  { label: 'Dashboard',   href: '/teacher/dashboard',   icon: <LayoutDashboard size={18} /> },
  { label: 'My Classes',  href: '/teacher/classes',     icon: <BookOpen size={18} /> },
  { label: 'Assignments', href: '/teacher/assignments', icon: <ClipboardList size={18} /> },
  { label: 'Materials',   href: '/teacher/materials',   icon: <FolderOpen size={18} /> },
  { label: 'Live Class',  href: '/teacher/live-class',  icon: <Video size={18} /> },
  { label: 'Attendance',  href: '/teacher/attendance',  icon: <ClipboardList size={18} /> },
  { label: 'Reports',     href: '/teacher/reports',     icon: <BarChart2 size={18} /> },
]
const studentNav = [
  { label: 'Dashboard',   href: '/student/dashboard',   icon: <LayoutDashboard size={18} /> },
  { label: 'My Classes',  href: '/student/classes',     icon: <BookMarked size={18} /> },
  { label: 'Schedule',    href: '/student/schedule',    icon: <CalendarDays size={18} /> },
  { label: 'Assignments', href: '/student/assignments', icon: <ClipboardList size={18} /> },
  { label: 'Recordings',  href: '/student/recordings',  icon: <PlayCircle size={18} /> },
  { label: 'Submissions', href: '/student/submissions', icon: <FileText size={18} /> },
]

const roleNavMap: Record<string, typeof adminNav> = { admin: adminNav, teacher: teacherNav, student: studentNav }
const roleLabelMap: Record<string, string> = { admin: 'Admin Portal', teacher: 'Teacher Portal', student: 'Student Portal' }
const roleColors: Record<string, string> = {
  admin: 'var(--accent-red)',
  teacher: 'var(--accent-blue)',
  student: 'var(--accent-green)',
}

interface SidebarProps {
  role: string
  userName?: string
  userEmail?: string
  open: boolean
  onClose: () => void
}

export function Sidebar({ role, userName, userEmail, open, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const navItems = roleNavMap[role] || []

  // Close sidebar on route change (mobile)
  useEffect(() => { onClose() }, [pathname]) // eslint-disable-line

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Signed out')
    router.push('/login')
  }

  const sidebarStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    height: '100%',
    width: 240,
    zIndex: 50,
    background: 'var(--bg-secondary)',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    transform: open ? 'translateX(0)' : 'translateX(-100%)',
    transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
    overflowY: 'auto',
  }

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    backdropFilter: 'blur(2px)',
    zIndex: 49,
    opacity: open ? 1 : 0,
    pointerEvents: open ? 'all' : 'none',
    transition: 'opacity 0.25s ease',
  }

  return (
    <>
      {/* Mobile overlay */}
      <div style={overlayStyle} onClick={onClose} aria-hidden />

      {/* Sidebar drawer */}
      <aside style={sidebarStyle}>
        {/* Brand + close btn */}
        <div style={{ padding: '16px 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#22c55e,#16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>☪️</div>
            <div>
              <p style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: 1.2 }}>Latifia Quraner Alo</p>
              <p style={{ fontSize: '0.7rem', fontWeight: 600, color: roleColors[role] || 'var(--accent-green)' }}>{roleLabelMap[role]}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ padding: 6, borderRadius: 8, background: 'var(--bg-hover)', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ height: 1, background: 'var(--border)', margin: '0 16px' }} />

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
          <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', padding: '0 8px 6px' }}>Navigation</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link key={item.href} href={item.href} className={`nav-item ${isActive ? 'active' : ''}`}>
                  {item.icon}
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {isActive && <ChevronRight size={14} style={{ color: 'var(--accent-blue)', flexShrink: 0 }} />}
                </Link>
              )
            })}
          </div>

          <div style={{ height: 1, background: 'var(--border)', margin: '10px 4px' }} />
          <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', padding: '0 8px 6px' }}>Account</p>
          <Link href="/messages"      className={`nav-item ${pathname.startsWith('/messages') ? 'active' : ''}`}><MessageCircle size={18} /><span>Messages</span></Link>
          <Link href="/notifications" className={`nav-item ${pathname.startsWith('/notifications') ? 'active' : ''}`}><Bell size={18} /><span>Notifications</span></Link>
          <Link href="/profile"       className={`nav-item ${pathname.startsWith('/profile') ? 'active' : ''}`}><Settings size={18} /><span>Profile</span></Link>
        </nav>

        {/* User footer */}
        <div style={{ padding: '10px 10px 12px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, background: 'var(--bg-hover)', marginBottom: 4 }}>
            <div className="avatar" style={{ width: 30, height: 30, fontSize: '0.65rem', flexShrink: 0 }}>
              {userName?.slice(0, 2).toUpperCase() || '??'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userName || 'User'}</p>
              <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userEmail || ''}</p>
            </div>
          </div>
          <button onClick={handleSignOut} className="nav-item w-full" style={{ color: 'var(--accent-red)', border: 'none', marginTop: 2 }}>
            <LogOut size={16} style={{ color: 'var(--accent-red)' }} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  )
}
