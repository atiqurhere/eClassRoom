import { Loader2 } from 'lucide-react'

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  fullPage?: boolean
}

export function Loading({ size = 'md', text, fullPage = false }: LoadingProps) {
  const sizeMap = { sm: 16, md: 24, lg: 40 }

  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2 size={sizeMap[size]} className="animate-spin" style={{ color: 'var(--accent-blue)' }} />
      {text && <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{text}</p>}
    </div>
  )

  if (fullPage) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        {content}
      </div>
    )
  }

  return content
}

// Skeleton loader components
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />
}

export function SkeletonCard() {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <Skeleton className="h-3 w-20 mb-2" />
          <Skeleton className="h-8 w-24" />
        </div>
        <Skeleton className="w-10 h-10 rounded-xl" />
      </div>
      <Skeleton className="h-3 w-16" />
    </div>
  )
}

export function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 4 }).map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  )
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={`h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`} />
      ))}
    </div>
  )
}
