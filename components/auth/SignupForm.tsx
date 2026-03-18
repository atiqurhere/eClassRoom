'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, User, IdCard } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { signupSchema, type SignupInput } from '@/lib/utils/validators'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { toast } from 'sonner'

export function SignupForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { role: 'student' },
  })

  const password = watch('password', '')
  const selectedRole = watch('role')

  const onSubmit = async (data: SignupInput) => {
    try {
      setLoading(true)
      const supabase = createClient()

      // Sign up via Supabase Auth
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: { full_name: data.fullName, role: data.role },
        },
      })
      if (authErr) throw authErr

      // Profile is auto-created by database trigger — optionally add student record
      if (authData.user && data.role === 'student' && data.studentId) {
        await supabase.from('students').insert({
          user_id: authData.user.id,
          student_id: data.studentId,
        })
      }

      toast.success('Account created! Check your email to confirm, then sign in.')
      router.push('/login')
    } catch (error: any) {
      toast.error(error.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const strengthLevel = password.length === 0 ? -1 : password.length < 8 ? 0 : password.length < 12 ? 1 : 2
  const strengthColors = ['var(--accent-red)', 'var(--accent-orange)', 'var(--accent-green)']
  const strengthLabels = ['Too short', 'Fair', 'Strong ✓']

  return (
    <div className="animate-fade-in">
      <div className="mb-7">
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          Create Account
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Join Latifia Quraner Alo e-classroom
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Full Name"
          placeholder="Your full name"
          leftIcon={<User size={15} />}
          error={errors.fullName?.message}
          {...register('fullName')}
        />
        <Input
          label="Email Address"
          type="email"
          placeholder="name@example.com"
          leftIcon={<Mail size={15} />}
          error={errors.email?.message}
          {...register('email')}
        />
        <Select
          label="Role"
          options={[
            { value: 'student', label: '👨‍🎓 Student' },
            { value: 'teacher', label: '👩‍🏫 Teacher' },
          ]}
          error={errors.role?.message}
          {...register('role')}
        />
        {selectedRole === 'student' && (
          <Input
            label="Student ID (optional)"
            placeholder="e.g. LQA-2026-001"
            leftIcon={<IdCard size={15} />}
            hint="Assigned by your institution"
            {...register('studentId')}
          />
        )}
        <Input
          label="Password"
          type="password"
          placeholder="Min 8 characters, 1 uppercase, 1 number"
          leftIcon={<Lock size={15} />}
          error={errors.password?.message}
          {...register('password')}
        />
        {strengthLevel >= 0 && (
          <div>
            <div className="progress-bar">
              <div className="progress-fill" style={{
                width: `${(strengthLevel + 1) * 33.3}%`,
                background: strengthColors[strengthLevel],
              }} />
            </div>
            <p className="text-xs mt-1" style={{ color: strengthColors[strengthLevel] }}>
              {strengthLabels[strengthLevel]}
            </p>
          </div>
        )}
        <Input
          label="Confirm Password"
          type="password"
          placeholder="Repeat your password"
          leftIcon={<Lock size={15} />}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        <Button type="submit" fullWidth loading={loading} variant="gradient" size="lg">
          Create Account
        </Button>
      </form>

      <p className="text-center text-sm mt-6" style={{ color: 'var(--text-muted)' }}>
        Already have an account?{' '}
        <Link href="/login" className="font-semibold" style={{ color: 'var(--accent-blue)' }}>
          Sign In
        </Link>
      </p>
    </div>
  )
}
