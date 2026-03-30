import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  padding?: string
}

export function Card({ children, className = '', hover = false, padding = 'p-6' }: CardProps) {
  return (
    <div className={`${hover ? 'glass-card-hover' : 'glass-card'} ${padding} ${className}`}>
      {children}
    </div>
  )
}

interface CardHeaderProps {
  title?: string
  subtitle?: string
  action?: ReactNode
  icon?: ReactNode
  className?: string
  children?: ReactNode
}

export function CardHeader({ title, subtitle, action, icon, className = '', children }: CardHeaderProps) {
  // If children are passed directly, render as a simple flex container
  if (children) {
    return (
      <div className={`section-card-header ${className}`}>
        {children}
      </div>
    )
  }
  // Otherwise use the structured title/icon/action layout
  return (
    <div className={`section-card-header ${className}`}>
      <div className="flex items-center gap-3 min-w-0">
        {icon && (
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--bg-hover)' }}>
            {icon}
          </div>
        )}
        <div className="min-w-0">
          {title && <h3 className="section-card-title">{title}</h3>}
          {subtitle && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>}
        </div>
      </div>
      {action && <div className="section-card-action">{action}</div>}
    </div>
  )
}

export function CardContent({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`section-card-body ${className}`}>{children}</div>
}

/** Standalone title — used inside arbitrary card layouts */
export function CardTitle({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <h3 className={`section-card-title ${className}`}>{children}</h3>
}

// Section card (with header+body structure)
interface SectionCardProps {
  title: string
  subtitle?: string
  action?: ReactNode
  icon?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
  /** Set true when children include a <table> so we auto-add overflow-x-scroll */
  scrollable?: boolean
}

export function SectionCard({ title, subtitle, action, icon, children, className = '', bodyClassName = '', scrollable }: SectionCardProps) {
  return (
    <div className={`section-card ${className}`}>
      <CardHeader title={title} subtitle={subtitle} action={action} icon={icon} />
      {scrollable ? (
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {children}
        </div>
      ) : (
        <div className={`section-card-body ${bodyClassName}`}>{children}</div>
      )}
    </div>
  )
}
