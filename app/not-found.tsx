import Link from 'next/link'
import { Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <div className="text-center">
        <p style={{ fontSize: '7rem', fontWeight: 800, lineHeight: 1,
          background: 'linear-gradient(135deg, #22c55e 0%, #f59e0b 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          404
        </p>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: 12, color: 'var(--text-primary)' }}>
          Page Not Found
        </h2>
        <p style={{ color: 'var(--text-muted)', marginTop: 8, maxWidth: 380, margin: '8px auto 32px' }}>
          The page you&apos;re looking for doesn&apos;t exist. It may have been moved or deleted.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/"
            style={{ padding: '12px 28px', background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff',
              borderRadius: 10, fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Home size={16} /> Go Home
          </Link>
          <Link href="/login"
            style={{ padding: '12px 24px', background: 'var(--bg-card)', color: 'var(--text-primary)',
              border: '1px solid var(--border)', borderRadius: 10, fontWeight: 600, textDecoration: 'none' }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}