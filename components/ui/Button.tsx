'use client'

import React, { forwardRef, ButtonHTMLAttributes, ReactNode, isValidElement, cloneElement } from 'react'
import { Loader2 } from 'lucide-react'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' | 'gradient'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  fullWidth?: boolean
  /**
   * When true, merges button styles into the single child element (e.g. Next.js <Link>).
   * The child must accept a `className` prop. No <button> wrapper is rendered.
   */
  asChild?: boolean
}

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:   'btn-primary',
  secondary: 'btn-secondary',
  danger:    'btn-danger',
  success:   'btn-success',
  ghost:     'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all cursor-pointer',
  gradient:  'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-1 hover:opacity-90 transition-all cursor-pointer shadow-glow',
}

const sizeClasses: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: '!px-3 !py-1.5 !text-xs',
  md: '',
  lg: '!px-6 !py-3 !text-base',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>((
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    className = '',
    children,
    disabled,
    asChild = false,
    ...props
  },
  ref
) => {
  const classes = [
    variantClasses[variant],
    sizeClasses[size],
    fullWidth ? 'w-full' : '',
    className,
  ].filter(Boolean).join(' ')

  // asChild: merge button classes onto the child element (e.g. a Next.js <Link>)
  if (asChild && isValidElement<{ className?: string }>(children)) {
    return cloneElement(children, {
      className: [classes, (children.props as { className?: string }).className]
        .filter(Boolean)
        .join(' '),
    })
  }

  return (
    <button
      ref={ref}
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin flex-shrink-0" />
      ) : leftIcon ? (
        <span className="flex-shrink-0">{leftIcon}</span>
      ) : null}
      {children}
      {rightIcon && !loading && (
        <span className="flex-shrink-0">{rightIcon}</span>
      )}
    </button>
  )
})

Button.displayName = 'Button'
