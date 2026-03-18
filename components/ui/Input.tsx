'use client'

import { forwardRef, InputHTMLAttributes, useState } from 'react'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightElement?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  hint,
  leftIcon,
  rightElement,
  type,
  className = '',
  id,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false)
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
  const isPassword = type === 'password'
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          type={inputType}
          className={`form-input ${leftIcon ? 'pl-10' : ''} ${(isPassword || rightElement) ? 'pr-10' : ''} ${error ? 'error' : ''} ${className}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
            style={{ color: 'var(--text-muted)' }}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
        {rightElement && !isPassword && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
            {rightElement}
          </div>
        )}
        {error && !isPassword && !rightElement && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--accent-red)' }}>
            <AlertCircle size={16} />
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1.5 text-xs flex items-center gap-1.5" style={{ color: 'var(--accent-red)' }}>
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="mt-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>{hint}</p>
      )}
    </div>
  )
})

Input.displayName = 'Input'

// Textarea
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label, error, hint, className = '', id, ...props
}, ref) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        className={`form-input resize-none ${error ? 'error' : ''} ${className}`}
        rows={4}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs" style={{ color: 'var(--accent-red)' }}>{error}</p>}
      {hint && !error && <p className="mt-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>{hint}</p>}
    </div>
  )
})
Textarea.displayName = 'Textarea'

// Select
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  hint?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  label, error, hint, options, placeholder, className = '', id, ...props
}, ref) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={inputId}
          className={`form-select ${error ? 'border-[var(--accent-red)]' : ''} ${className}`}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path d="M6 8L1 3h10L6 8z" />
          </svg>
        </div>
      </div>
      {error && <p className="mt-1.5 text-xs" style={{ color: 'var(--accent-red)' }}>{error}</p>}
      {hint && !error && <p className="mt-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>{hint}</p>}
    </div>
  )
})
Select.displayName = 'Select'
