'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, IdCard } from 'lucide-react'
import { authService } from '@/lib/services/auth.service'
import { loginSchema, type LoginInput } from '@/lib/utils/validators'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { toast } from 'sonner'

export function LoginForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loginMode, setLoginMode] = useState<'email' | 'student_id'>('email')

  useEffect(() => {
    // If the database was wiped and middleware bounced them back here,
    // their browser is technically still stuck logged in strictly via Supabase Auth.
    // Force a complete logout so they can sign up / start fresh again.
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('error') === 'profile_missing') {
        authService.signOut().then(() => {
          toast.error('Your account profile is missing. You have been securely logged out. Please sign up again or contact admin.')
          window.history.replaceState({}, document.title, '/login')
        }).catch(() => {})
      }
    }
  }, [])

  const { register, handleSubmit, formState: { errors }, reset } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginInput) => {
    try {
      setLoading(true)
      const result = await authService.signIn(data.email, data.password)
      if (result.user) {
        // role lives in public.users, not in the Supabase auth response
        const profile = await authService.getCurrentUser()
        toast.success('Welcome back!')
        const role = profile?.role || 'student'
        window.location.href = `/${role}/dashboard`
      }
    } catch (error: any) {
      toast.error(error.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleStudentIdLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const studentId = (form.elements.namedItem('studentId') as HTMLInputElement)?.value
    const password = (form.elements.namedItem('password') as HTMLInputElement)?.value

    if (!studentId || !password) {
      toast.error('Please fill in all fields')
      return
    }
    try {
      setLoading(true)
      // Look up email by student ID
      const res = await fetch('/api/auth/student-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Login failed')
      toast.success('Welcome back!')
      const role = data.role || 'student'
      window.location.href = `/${role}/dashboard`
    } catch (error: any) {
      toast.error(error.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          Welcome back 👋
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Sign in to continue to your workspace
        </p>
      </div>

      {/* Login mode toggle */}
      <div className="flex rounded-lg p-1 mb-6" style={{ background: 'var(--bg-secondary)' }}>
        <button
          type="button"
          onClick={() => { setLoginMode('email'); reset() }}
          className="flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all"
          style={{
            background: loginMode === 'email' ? 'var(--bg-card)' : 'transparent',
            color: loginMode === 'email' ? 'var(--text-primary)' : 'var(--text-muted)',
            border: loginMode === 'email' ? '1px solid var(--border)' : 'none',
          }}
        >
          Email Login
        </button>
        <button
          type="button"
          onClick={() => { setLoginMode('student_id'); reset() }}
          className="flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all"
          style={{
            background: loginMode === 'student_id' ? 'var(--bg-card)' : 'transparent',
            color: loginMode === 'student_id' ? 'var(--text-primary)' : 'var(--text-muted)',
            border: loginMode === 'student_id' ? '1px solid var(--border)' : 'none',
          }}
        >
          Student ID
        </button>
      </div>

      {loginMode === 'email' ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="name@school.edu"
            leftIcon={<Mail size={16} />}
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label="Password"
            type="password"
            placeholder="Enter your password"
            leftIcon={<Lock size={16} />}
            error={errors.password?.message}
            {...register('password')}
          />

          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-xs font-medium" style={{ color: 'var(--accent-blue)' }}>
              Forgot password?
            </Link>
          </div>

          <Button type="submit" fullWidth loading={loading} variant="gradient" size="lg">
            Sign In
          </Button>
        </form>
      ) : (
        <form onSubmit={handleStudentIdLogin} className="space-y-4">
          <Input
            label="Student ID"
            name="studentId"
            placeholder="e.g. STU-2026-001"
            leftIcon={<IdCard size={16} />}
          />
          <Input
            label="Password"
            name="password"
            type="password"
            placeholder="Enter your password"
            leftIcon={<Lock size={16} />}
          />
          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-xs font-medium" style={{ color: 'var(--accent-blue)' }}>
              Forgot password?
            </Link>
          </div>
          <Button type="submit" fullWidth loading={loading} variant="gradient" size="lg">
            Sign In with Student ID
          </Button>
        </form>
      )}

      <p className="text-center text-sm mt-6" style={{ color: 'var(--text-muted)' }}>
        Don&#39;t have an account?{' '}
        <Link href="/signup" className="font-semibold" style={{ color: 'var(--accent-blue)' }}>
          Contact your admin
        </Link>
      </p>
    </div>
  )
}
