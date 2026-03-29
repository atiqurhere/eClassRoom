import { LoginForm } from '@/components/auth/LoginForm'

export const metadata = {
  title: 'Sign In - E-Classroom LMS',
  description: 'Sign in to your E-Classroom account',
}

export default function LoginPage() {
  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, textAlign: 'center' }}>
        Sign In
      </h2>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: 28 }}>
        Welcome back — enter your credentials below
      </p>
      <LoginForm />
    </div>
  )
}
