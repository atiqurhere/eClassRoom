import { ReactNode } from 'react'
import { GraduationCap } from 'lucide-react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient glow blobs */}
      <div className="auth-glow auth-glow-blue" />
      <div className="auth-glow auth-glow-purple" />

      <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 56,
              height: 56,
              borderRadius: '16px',
              background: 'var(--gradient-1)',
              boxShadow: 'var(--shadow-glow)',
              marginBottom: 16,
            }}
          >
            <GraduationCap size={28} color="#fff" />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            E-Classroom LMS
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 4 }}>
            Modern Learning Management System
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: 32,
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          {children}
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 24 }}>
          © 2026 E-Classroom. All rights reserved.
        </p>
      </div>
    </div>
  )
}
