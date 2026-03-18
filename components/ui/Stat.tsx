import { ReactNode } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: ReactNode
  iconColor?: string
  trend?: number
  trendLabel?: string
  gradient?: boolean
  className?: string
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  iconColor = 'var(--accent-blue)',
  trend,
  trendLabel,
  gradient = false,
  className = '',
}: StatCardProps) {
  const isPositive = trend !== undefined && trend > 0
  const isNegative = trend !== undefined && trend < 0
  const isNeutral = trend === 0

  return (
    <div className={`stat-card ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>
            {title}
          </p>
          <p className={`text-3xl font-bold ${gradient ? 'gradient-text' : ''}`}
            style={!gradient ? { color: 'var(--text-primary)' } : undefined}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${iconColor}20`, color: iconColor }}>
            {icon}
          </div>
        )}
      </div>
      {trend !== undefined && (
        <div className="flex items-center gap-1.5">
          <span className="flex items-center gap-0.5 text-xs font-semibold"
            style={{ color: isPositive ? 'var(--accent-green)' : isNegative ? 'var(--accent-red)' : 'var(--text-muted)' }}>
            {isPositive ? <TrendingUp size={12} /> : isNegative ? <TrendingDown size={12} /> : <Minus size={12} />}
            {isPositive ? '+' : ''}{trend}%
          </span>
          {trendLabel && (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{trendLabel}</span>
          )}
        </div>
      )}
    </div>
  )
}
