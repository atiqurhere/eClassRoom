'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { authService } from '@/lib/services/auth.service'
import { signupSchema, type SignupInput } from '@/lib/utils/validators'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
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

  const selectedRole = watch('role')

  const onSubmit = async (data: SignupInput) => {
    try {
      setLoading(true)
      await authService.signUp(data.email, data.password, data.fullName, data.role, data.studentId)
      toast.success('Account created! Please sign in.')
      router.push('/login')
    } catch (error: any) {
      toast.error(error.message || 'Signup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Input
        label="Full Name"
        type="text"
        placeholder="Enter your full name"
        error={errors.fullName?.message}
        {...register('fullName')}
      />

      <Input
        label="Email"
        type="email"
        placeholder="Enter your email"
        error={errors.email?.message}
        {...register('email')}
      />

      <div>
        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
          Role
        </label>
        <select className="form-select" {...register('role')}>
          <option value="student">Student</option>
          <option value="teacher">Teacher</option>
          <option value="admin">Admin</option>
        </select>
        {errors.role && (
          <p style={{ marginTop: 4, fontSize: '0.8125rem', color: 'var(--accent-red)' }}>{errors.role.message}</p>
        )}
      </div>

      {selectedRole === 'student' && (
        <Input
          label="Student ID"
          type="text"
          placeholder="Enter your student ID"
          error={errors.studentId?.message}
          {...register('studentId')}
        />
      )}

      <Input
        label="Password"
        type="password"
        placeholder="Enter your password"
        error={errors.password?.message}
        {...register('password')}
      />

      <Input
        label="Confirm Password"
        type="password"
        placeholder="Confirm your password"
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />

      <Button type="submit" variant="gradient" size="lg" fullWidth loading={loading} style={{ marginTop: 4 }}>
        Create Account
      </Button>

      <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
        Already have an account?{' '}
        <Link href="/login" style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 600 }}>
          Sign in
        </Link>
      </p>
    </form>
  )
}
