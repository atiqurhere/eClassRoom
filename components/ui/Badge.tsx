interface BadgeProps {
  children: React.ReactNode
  variant?: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'gray'
  className?: string
}

export function Badge({ children, variant = 'blue', className = '' }: BadgeProps) {
  return (
    <span className={`badge badge-${variant} ${className}`}>
      {children}
    </span>
  )
}

// Role badge
const roleBadgeMap = {
  admin: 'red',
  teacher: 'blue',
  student: 'green',
} as const

export function RoleBadge({ role }: { role: string }) {
  const variant = roleBadgeMap[role as keyof typeof roleBadgeMap] || 'gray'
  const labels = { admin: '👑 Admin', teacher: '👩‍🏫 Teacher', student: '👨‍🎓 Student' }
  return <Badge variant={variant}>{labels[role as keyof typeof labels] || role}</Badge>
}

// Status badge
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: BadgeProps['variant']; label: string }> = {
    live: { variant: 'green', label: '🔴 Live' },
    scheduled: { variant: 'blue', label: '📅 Scheduled' },
    ended: { variant: 'gray', label: '✅ Ended' },
    submitted: { variant: 'blue', label: '📤 Submitted' },
    graded: { variant: 'green', label: '✅ Graded' },
    late: { variant: 'orange', label: '⚠️ Late' },
    present: { variant: 'green', label: '✓ Present' },
    absent: { variant: 'red', label: '✗ Absent' },
    active: { variant: 'green', label: '● Active' },
    inactive: { variant: 'gray', label: '○ Inactive' },
  }
  const { variant, label } = map[status?.toLowerCase()] || { variant: 'gray', label: status }
  return <Badge variant={variant}>{label}</Badge>
}
