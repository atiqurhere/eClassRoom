'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, BookOpen, Video, FileText,
  BarChart2, Settings, LogOut, ChevronRight,
  ClipboardList, BookMarked, Monitor, Bell, MessageCircle, UserPlus,
  Megaphone, CalendarDays, FolderOpen, PlayCircle
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

const adminNav = [
  { label: 'Dashboard',      href: '/admin/dashboard',      icon: <LayoutDashboard size={18} /> },
  { label: 'Users',          href: '/admin/users',          icon: <Users size={18} /> },
  { label: 'Invites',        href: '/admin/invites',        icon: <UserPlus size={18} /> },
  { label: 'Classes',        href: '/admin/classes',        icon: <BookOpen size={18} /> },
  { label: 'Schedule',       href: '/admin/schedule',       icon: <CalendarDays size={18} /> },
  { label: 'Announcements',  href: '/admin/announcements',  icon: <Megaphone size={18} /> },
  { label: 'Monitoring',     href: '/admin/monitoring',     icon: <Monitor size={18} /> },
  { label: 'Reports',        href: '/admin/reports',        icon: <BarChart2 size={18} /> },
]
const teacherNav = [
  { label: 'Dashboard',   href: '/teacher/dashboard',   icon: <LayoutDashboard size={18} /> },
  { label: 'My Classes',  href: '/teacher/classes',     icon: <BookOpen size={18} /> },
  { label: 'Assignments', href: '/teacher/assignments', icon: <ClipboardList size={18} /> },
  { label: 'Materials',   href: '/teacher/materials',   icon: <FolderOpen size={18} /> },
  { label: 'Live Class',  href: '/teacher/live-class',  icon: <Video size={18} /> },
  { label: 'Attendance',  href: '/teacher/attendance',  icon: <ClipboardList size={18} /> },
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
}

export function Sidebar({ role, userName, userEmail }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const navItems = roleNavMap[role] || []

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    toast.success('Signed out successfully')
  }

  return (
    <aside className="flex flex-col h-full flex-shrink-0" style={{ width: 240, background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)' }}>
      {/* Brand */}
      <div className="px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg" style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' }}>
            ☪️
          </div>
          <div>
            <p className="text-xs font-bold" style={{ color: 'var(--text-primary)', lineHeight: 1.2 }}>Latifia Quraner Alo</p>
            <p className="text-xs font-medium" style={{ color: roleColors[role] || 'var(--accent-green)' }}>{roleLabelMap[role]}</p>
          </div>
        </div>
      </div>

      <div className="h-px mx-4" style={{ background: 'var(--border)' }} />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <p className="text-xs font-semibold uppercase tracking-wider px-3 mb-2" style={{ color: 'var(--text-muted)' }}>
          Navigation
        </p>
        <div className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link key={item.href} href={item.href} className={`nav-item ${isActive ? 'active' : ''}`}>
                {item.icon}
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight size={14} style={{ color: 'var(--accent-blue)', flexShrink: 0 }} />}
              </Link>
            )
          })}
        </div>

        <div className="h-px my-3 mx-2" style={{ background: 'var(--border)' }} />

        <p className="text-xs font-semibold uppercase tracking-wider px-3 mb-2" style={{ color: 'var(--text-muted)' }}>
          Account
        </p>
        <Link href="/messages" className={`nav-item ${pathname.startsWith('/messages') ? 'active' : ''}`}>
          <MessageCircle size={18} />
          <span>Messages</span>
        </Link>
        <Link href="/notifications" className={`nav-item ${pathname.startsWith('/notifications') ? 'active' : ''}`}>
          <Bell size={18} />
          <span>Notifications</span>
        </Link>
        <Link href="/profile" className={`nav-item ${pathname.startsWith('/profile') ? 'active' : ''}`}>
          <Settings size={18} />
          <span>Profile</span>
        </Link>
      </nav>

      {/* User + Sign out */}
      <div className="p-3" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1" style={{ background: 'var(--bg-hover)' }}>
          <div className="avatar w-8 h-8 text-xs flex-shrink-0">
            {userName?.slice(0, 2).toUpperCase() || '??'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{userName || 'User'}</p>
            <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{userEmail || ''}</p>
          </div>
        </div>
        <button onClick={handleSignOut} className="nav-item w-full text-left mt-1" style={{ color: 'var(--accent-red)' }}>
          <LogOut size={16} style={{ color: 'var(--accent-red)' }} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
