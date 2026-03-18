'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) { toast.error('Please enter your email'); return }
    try {
      setLoading(true)
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw error
      setSent(true)
    } catch (error: any) {
      toast.error(error.message || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="animate-fade-in text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ background: 'rgba(34,197,94,0.15)' }}>
          <CheckCircle size={32} style={{ color: 'var(--accent-green)' }} />
        </div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Check your email</h1>
        <p className="text-sm mb-6" style={{ color: 'var(--text-muted)', maxWidth: 320, margin: '0 auto 24px' }}>
          We sent a password reset link to <strong style={{ color: 'var(--text-secondary)' }}>{email}</strong>. 
          Check your inbox and click the link to reset your password.
        </p>
        <Button variant="secondary" fullWidth onClick={() => setSent(false)}>Send again</Button>
        <Link href="/login" className="block mt-4 text-sm" style={{ color: 'var(--accent-blue)' }}>
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Forgot password?</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          No worries — we&apos;ll send you reset instructions.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          placeholder="name@school.edu"
          leftIcon={<Mail size={16} />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Button type="submit" fullWidth loading={loading} variant="gradient" size="lg">
          Send Reset Link
        </Button>
      </form>

      <Link href="/login" className="flex items-center justify-center gap-2 mt-5 text-sm" style={{ color: 'var(--text-muted)' }}>
        <ArrowLeft size={14} /> Back to sign in
      </Link>
    </div>
  )
}
