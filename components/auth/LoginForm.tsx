'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { authService } from '@/lib/services/auth.service'
import { loginSchema, type LoginInput } from '@/lib/utils/validators'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { toast } from 'sonner'

export function LoginForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginInput) => {
    try {
      setLoading(true)
      const result = await authService.signIn(data.email, data.password)
      if (result.user) {
        toast.success('Login successful!')
        router.push('/')
        router.refresh()
      }
    } catch (error: any) {
      toast.error(error.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Input
        label="Email"
        type="email"
        placeholder="Enter your email"
        error={errors.email?.message}
        {...register('email')}
      />

      <Input
        label="Password"
        type="password"
        placeholder="Enter your password"
        error={errors.password?.message}
        {...register('password')}
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -12 }}>
        <Link
          href="/forgot-password"
          style={{ fontSize: '0.8125rem', color: 'var(--accent-blue)', textDecoration: 'none' }}
        >
          Forgot password?
        </Link>
      </div>

      <Button type="submit" variant="gradient" size="lg" fullWidth loading={loading}>
        Sign In
      </Button>

      <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: 4 }}>
        Don&apos;t have an account?{' '}
        <Link href="/signup" style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 600 }}>
          Sign up
        </Link>
      </p>
    </form>
  )
}
