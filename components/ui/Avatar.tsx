interface AvatarProps {
  name?: string | null
  src?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl',
}

function getInitials(name?: string | null) {
  if (!name) return '?'
  return name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0]?.toUpperCase() || '')
    .join('')
}

export function Avatar({ name, src, size = 'md', className = '' }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name || 'User'}
        className={`avatar ${sizeClasses[size]} object-cover ${className}`}
      />
    )
  }

  return (
    <div className={`avatar ${sizeClasses[size]} ${className}`}>
      {getInitials(name)}
    </div>
  )
}

interface AvatarWithNameProps extends AvatarProps {
  subtitle?: string | null
  subtitleClassName?: string
}

export function AvatarWithName({ name, src, size = 'sm', subtitle, subtitleClassName = '', className = '' }: AvatarWithNameProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Avatar name={name} src={src} size={size} />
      <div className="min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{name || 'Unknown'}</p>
        {subtitle && <p className={`text-xs truncate ${subtitleClassName}`} style={{ color: 'var(--text-muted)' }}>{subtitle}</p>}
      </div>
    </div>
  )
}
