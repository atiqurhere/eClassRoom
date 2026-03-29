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
  title: string
  subtitle?: string
  action?: ReactNode
  icon?: ReactNode
  children?: ReactNode
  className?: string
}

export function CardHeader({ title, subtitle, action, icon, children, className = '' }: CardHeaderProps) {
  return (
    <div className={`section-card-header ${className}`}>
      <div className="flex items-center gap-3">
        {icon && (
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--bg-hover)' }}>
            {icon}
          </div>
        )}
        <div>
          <h3 className="section-card-title">{title}</h3>
          {subtitle && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>}
        </div>
      </div>
      {action && <div>{action}</div>}
      {children}
    </div>
  )
}

/** Standalone card title — used as a heading inside arbitrary card layouts */
export function CardTitle({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <h3 className={`section-card-title ${className}`}>{children}</h3>
  )
}

export function CardContent({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`section-card-body ${className}`}>{children}</div>
}

// Section card (with header + body structure)
export interface SectionCardProps {
  title: string
  subtitle?: string
  action?: ReactNode
  icon?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
  /** Makes the card body vertically scrollable (max-height: 420px) */
  scrollable?: boolean
}

export function SectionCard({
  title, subtitle, action, icon, children,
  className = '', bodyClassName = '', scrollable = false,
}: SectionCardProps) {
  return (
    <div className={`section-card ${className}`}>
      <CardHeader title={title} subtitle={subtitle} action={action} icon={icon} />
      <div
        className={`section-card-body ${bodyClassName}`}
        style={scrollable ? { overflowY: 'auto', maxHeight: 420 } : undefined}
      >
        {children}
      </div>
    </div>
  )
}
