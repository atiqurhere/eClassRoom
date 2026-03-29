import { SignupForm } from '@/components/auth/SignupForm'

export const metadata = {
  title: 'Sign Up - E-Classroom LMS',
  description: 'Create your E-Classroom account',
}

export default function SignupPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
        Create Your Account
      </h2>
      <SignupForm />
    </div>
  )
}
