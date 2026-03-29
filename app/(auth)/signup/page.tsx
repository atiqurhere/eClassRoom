import { SignupForm } from '@/components/auth/SignupForm'

export const metadata = {
  title: 'Sign Up - E-Classroom LMS',
  description: 'Create your E-Classroom account',
}

export default function SignupPage() {
  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, textAlign: 'center' }}>
        Create Account
      </h2>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: 28 }}>
        Fill in your details to get started
      </p>
      <SignupForm />
    </div>
  )
}
