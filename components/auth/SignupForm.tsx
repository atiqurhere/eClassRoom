'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { IdCard, User, Mail, Lock, CheckCircle, ArrowRight, AlertCircle } from 'lucide-react'

type InviteType = 'student' | 'teacher'
type Step = 'choose' | 'verify' | 'register'

interface InviteInfo {
  name: string
  class_id?: string
  shift?: string
}

export function SignupForm() {
  const [step, setStep]           = useState<Step>('choose')
  const [inviteType, setInviteType] = useState<InviteType>('student')
  const [inviteCode, setInviteCode] = useState('')
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null)
  const [loading, setLoading]     = useState(false)

  // Step 2 fields
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // ── Step 1: Verify invite code ──────────────────────────────────────────
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteCode.trim()) { toast.error('Please enter your ID'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/validate-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: inviteCode.trim().toUpperCase(), type: inviteType }),
      })
      const data = await res.json()
      if (!data.valid) { toast.error(data.message); return }
      setInviteInfo({ name: data.name, class_id: data.class_id, shift: data.shift })
      setStep('register')
      toast.success(`Welcome, ${data.name}! Complete your registration below.`)
    } catch {
      toast.error('Verification failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Step 2: Create account ──────────────────────────────────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) { toast.error('Passwords do not match'); return }
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    setLoading(true)
    try {
      const supabase = createClient()
      const role = inviteType === 'student' ? 'student' : 'teacher'

      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: inviteInfo!.name, role },
        },
      })
      if (authErr) throw authErr

      // Claim the invite so it can't be reused
      await fetch('/api/auth/claim-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: inviteCode.trim().toUpperCase(), type: inviteType, userId: authData.user?.id }),
      })

      toast.success('Account created! Check your email to verify, then sign in.')
      window.location.href = '/login'
    } catch (err: any) {
      toast.error(err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '10px 12px 10px 38px',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    color: 'var(--text-primary)',
    fontSize: '0.9rem',
    outline: 'none',
  }
  const labelStyle = { fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }
  const iconWrap = { position: 'absolute' as const, left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }

  // ── STEP: Choose role ───────────────────────────────────────────────────
  if (step === 'choose') {
    return (
      <div className="animate-fade-in">
        <div className="mb-7">
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Create Account</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Select your account type to get started</p>
        </div>
        <div style={{ display: 'grid', gap: 14 }}>
          <button
            onClick={() => { setInviteType('student'); setStep('verify') }}
            style={{
              padding: '20px 24px', background: 'var(--bg-card)', border: '2px solid var(--border)',
              borderRadius: 14, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s ease',
            }}
            onMouseOver={e => (e.currentTarget.style.borderColor = 'var(--accent-blue)')}
            onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            <div style={{ fontSize: '1.75rem', marginBottom: 8 }}>👨‍🎓</div>
            <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>I'm a Student</p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>I have a Student ID provided by the admin</p>
          </button>
          <button
            onClick={() => { setInviteType('teacher'); setStep('verify') }}
            style={{
              padding: '20px 24px', background: 'var(--bg-card)', border: '2px solid var(--border)',
              borderRadius: 14, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s ease',
            }}
            onMouseOver={e => (e.currentTarget.style.borderColor = '#22c55e')}
            onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            <div style={{ fontSize: '1.75rem', marginBottom: 8 }}>👩‍🏫</div>
            <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>I'm a Teacher</p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>I have a Teacher ID provided by the admin</p>
          </button>
        </div>
        <div style={{ marginTop: 20, padding: '14px 16px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <AlertCircle size={16} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Accounts require a pre-assigned ID from the admin. If you don't have one, please contact your administrator.
          </p>
        </div>
        <p className="text-center text-sm mt-6" style={{ color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link href="/login" className="font-semibold" style={{ color: 'var(--accent-blue)' }}>Sign In</Link>
        </p>
      </div>
    )
  }

  // ── STEP: Verify ID ─────────────────────────────────────────────────────
  if (step === 'verify') {
    return (
      <div className="animate-fade-in">
        <button onClick={() => setStep('choose')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6 }}>
          ← Back
        </button>
        <div className="mb-7">
          <div style={{ fontSize: '2rem', marginBottom: 10 }}>{inviteType === 'student' ? '👨‍🎓' : '👩‍🏫'}</div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            Enter your {inviteType === 'student' ? 'Student' : 'Teacher'} ID
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            This was provided by your administrator
          </p>
        </div>
        <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={labelStyle}>{inviteType === 'student' ? 'Student' : 'Teacher'} ID</label>
            <div style={{ position: 'relative' }}>
              <div style={iconWrap}><IdCard size={15} /></div>
              <input
                value={inviteCode}
                onChange={e => setInviteCode(e.target.value)}
                placeholder={inviteType === 'student' ? 'e.g. LQA-2026-001' : 'e.g. LQA-TCH-001'}
                style={{ ...inputStyle, textTransform: 'uppercase' }}
                autoFocus
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px', background: 'var(--accent-blue)', color: '#fff', border: 'none',
              borderRadius: 10, fontWeight: 700, fontSize: '0.9375rem', cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {loading ? 'Verifying…' : <><span>Verify ID</span><ArrowRight size={16} /></>}
          </button>
        </form>
        <p className="text-center text-sm mt-6" style={{ color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link href="/login" className="font-semibold" style={{ color: 'var(--accent-blue)' }}>Sign In</Link>
        </p>
      </div>
    )
  }

  // ── STEP: Register ──────────────────────────────────────────────────────
  const strengthLevel = password.length === 0 ? -1 : password.length < 8 ? 0 : password.length < 12 ? 1 : 2
  const strengthColors = ['var(--accent-red)', 'var(--accent-orange)', 'var(--accent-green)']
  const strengthLabels = ['Too short', 'Fair', 'Strong ✓']

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 10, marginBottom: 20 }}>
          <CheckCircle size={16} style={{ color: '#22c55e', flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#22c55e' }}>ID Verified ✓</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Welcome, <strong>{inviteInfo?.name}</strong>
              {inviteInfo?.shift ? ` · ${inviteInfo.shift} shift` : ''}
            </p>
          </div>
        </div>
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Complete Registration</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Create your login credentials</p>
      </div>

      <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Full Name (read-only from invite) */}
        <div>
          <label style={labelStyle}>Full Name</label>
          <div style={{ position: 'relative' }}>
            <div style={iconWrap}><User size={15} /></div>
            <input value={inviteInfo?.name || ''} readOnly style={{ ...inputStyle, opacity: 0.7, cursor: 'not-allowed' }} />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Email Address</label>
          <div style={{ position: 'relative' }}>
            <div style={iconWrap}><Mail size={15} /></div>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="name@example.com" style={inputStyle} required
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Password</label>
          <div style={{ position: 'relative' }}>
            <div style={iconWrap}><Lock size={15} /></div>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Min 8 characters" style={inputStyle} required
            />
          </div>
          {strengthLevel >= 0 && (
            <div style={{ marginTop: 6 }}>
              <div style={{ height: 4, background: 'var(--bg-secondary)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(strengthLevel + 1) * 33.3}%`, background: strengthColors[strengthLevel], transition: 'all 0.3s ease', borderRadius: 2 }} />
              </div>
              <p style={{ fontSize: '0.75rem', color: strengthColors[strengthLevel], marginTop: 4 }}>{strengthLabels[strengthLevel]}</p>
            </div>
          )}
        </div>

        <div>
          <label style={labelStyle}>Confirm Password</label>
          <div style={{ position: 'relative' }}>
            <div style={iconWrap}><Lock size={15} /></div>
            <input
              type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Repeat your password" style={inputStyle} required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '12px', background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff',
            border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '0.9375rem',
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: 4,
          }}
        >
          {loading ? 'Creating Account…' : 'Create Account'}
        </button>
      </form>
    </div>
  )
}
