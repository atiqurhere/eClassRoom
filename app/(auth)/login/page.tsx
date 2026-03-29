import { LoginForm } from '@/components/auth/LoginForm'

export const metadata = {
  title: 'Login - E-Classroom LMS',
  description: 'Sign in to your E-Classroom account',
}

export default function LoginPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
        Sign In to Your Account
      </h2>
      <LoginForm />
    </div>
  )
}
