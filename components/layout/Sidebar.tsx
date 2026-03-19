'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, BookOpen, Video,
  FileText, BarChart2, Settings, LogOut,
  ChevronRight, ClipboardList, BookMarked,
  Monitor, Bell, MessageCircle, UserPlus,
  Megaphone, CalendarDays, FolderOpen, PlayCircle, X,
  GraduationCap, ShieldAlert, Layers,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

const adminNav = [
  { label: 'Dashboard',       href: '/admin/dashboard',       icon: <LayoutDashboard size={18} /> },
  { label: 'Users',           href: '/admin/users',           icon: <Users size={18} /> },
  { label: 'Invites',         href: '/admin/invites',         icon: <UserPlus size={18} /> },
  { label: 'Courses',         href: '/admin/courses',         icon: <GraduationCap size={18} /> },
  { label: 'Classes',         href: '/admin/classes',         icon: <Layers size={18} /> },
  { label: 'Assign Students', href: '/admin/assign-students', icon: <Users size={18} /> },
  { label: 'Schedule',        href: '/admin/schedule',        icon: <CalendarDays size={18} /> },
  { label: 'Announcements',   href: '/admin/announcements',   icon: <Megaphone size={18} /> },
  { label: 'Monitoring',      href: '/admin/monitoring',      icon: <Monitor size={18} /> },
  { label: 'Chat Monitor',    href: '/admin/chat-monitor',    icon: <ShieldAlert size={18} /> },
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
  mobileOpen: boolean
  onClose: () => void
}

export function Sidebar({ role, userName, userEmail, mobileOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const navItems = roleNavMap[role] || []

  // Close mobile drawer on route change
  useEffect(() => { onClose() }, [pathname]) // eslint-disable-line

  // Escape key to close
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onClose])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Signed out')
    router.push('/login')
  }

  return (
    <aside className={`sidebar${mobileOpen ? ' sidebar--open' : ''}`}>
      {/* Brand */}
      <div className="sidebar-brand">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#22c55e,#16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>☪️</div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Latifia Quraner Alo</p>
            <p style={{ fontSize: '0.7rem', fontWeight: 600, color: roleColors[role] || 'var(--accent-green)' }}>{roleLabelMap[role]}</p>
          </div>
        </div>
        {/* Close button — only relevant on mobile */}
        <button onClick={onClose} className="sidebar-close-btn" aria-label="Close sidebar">
          <X size={16} />
        </button>
      </div>

      <div style={{ height: 1, background: 'var(--border)', margin: '0 12px' }} />

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
        <p style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', padding: '0 8px 6px' }}>Navigation</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link key={item.href} href={item.href} className={`nav-item${isActive ? ' active' : ''}`}>
                {item.icon}
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
                {isActive && <ChevronRight size={13} style={{ color: 'var(--accent-blue)', flexShrink: 0 }} />}
              </Link>
            )
          })}
        </div>

        <div style={{ height: 1, background: 'var(--border)', margin: '10px 4px' }} />

        <p style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', padding: '0 8px 6px' }}>Account</p>
        <Link href="/messages"      className={`nav-item${pathname.startsWith('/messages') ? ' active' : ''}`}><MessageCircle size={17} /><span>Messages</span></Link>
        <Link href="/notifications" className={`nav-item${pathname.startsWith('/notifications') ? ' active' : ''}`}><Bell size={17} /><span>Notifications</span></Link>
        <Link href="/profile"       className={`nav-item${pathname.startsWith('/profile') ? ' active' : ''}`}><Settings size={17} /><span>Profile</span></Link>
      </nav>

      {/* User + sign out */}
      <div style={{ padding: '8px 8px 10px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 10, background: 'var(--bg-hover)', marginBottom: 4 }}>
          <div className="avatar" style={{ width: 28, height: 28, fontSize: '0.6rem', flexShrink: 0 }}>
            {userName?.slice(0, 2).toUpperCase() || '??'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userName || 'User'}</p>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userEmail || ''}</p>
          </div>
        </div>
        <button onClick={handleSignOut} className="nav-item" style={{ color: 'var(--accent-red)', border: 'none', width: '100%' }}>
          <LogOut size={16} style={{ color: 'var(--accent-red)', flexShrink: 0 }} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
