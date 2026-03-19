'use client'

import { useState, useEffect, useRef } from 'react'
import { User, Lock, Camera, Save, Loader2, Copy, CheckCircle, Hash } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { SectionCard } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { RoleBadge } from '@/components/ui/Badge'
import { toast } from 'sonner'

export default function ProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile]   = useState<any>(null)
  const [dataLoading, setDataLoading] = useState(true)
  const [fullName, setFullName] = useState('')
  const [saving, setSaving] = useState(false)
  const [pwdLoading, setPwdLoading] = useState(false)
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [accountId, setAccountId] = useState<string | null>(null)
  const [idCopied, setIdCopied] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch full fresh profile from DB — don’t rely on useAuth initial state which can be null
  useEffect(() => {
    if (!user?.id) return
    const supabase = createClient()
    const load = async () => {
      setDataLoading(true)
      const { data } = await supabase
        .from('users')
        .select('id, full_name, email, role, avatar_url, student_id')
        .eq('id', user.id)
        .single()
      if (data) {
        setProfile(data)
        setFullName(data.full_name || '')
        setAvatarUrl(data.avatar_url || '')
      }
      setDataLoading(false)
    }
    load()
  }, [user?.id])

  // Fetch the user's invite code from DB (student_code or teacher_code)
  useEffect(() => {
    if (!user?.id || !profile?.role) return
    const supabase = createClient()
    const fetchId = async () => {
      // In v2 student_id lives directly on users table
      if (profile.role === 'student' && profile.student_id) {
        setAccountId(profile.student_id)
      } else if (profile.role === 'teacher') {
        const { data } = await supabase
          .from('teacher_invites').select('teacher_code').eq('user_id', user.id).single()
        setAccountId(data?.teacher_code ?? null)
      }
    }
    fetchId()
  }, [user?.id, profile])

  const copyId = () => {
    if (!accountId) return
    navigator.clipboard.writeText(accountId)
    setIdCopied(true)
    toast.success('ID copied to clipboard!')
    setTimeout(() => setIdCopied(false), 2000)
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user?.id) return
    if (file.size > 2 * 1024 * 1024) { toast.error('Max file size is 2MB'); return }
    try {
      setAvatarUploading(true)
      const supabase = createClient()
      const ext = file.name.split('.').pop()
      const path = `avatars/${user.id}.${ext}`
      const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
      if (upErr) throw upErr
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
      const publicUrl = urlData.publicUrl
      await supabase.from('users').update({ avatar_url: publicUrl }).eq('id', user.id)
      setAvatarUrl(publicUrl)
      toast.success('Avatar updated!')
    } catch (err: any) {
      toast.error(err.message || 'Upload failed')
    } finally {
      setAvatarUploading(false)
    }
  }

  const handleSaveProfile = async () => {
    try {
      setSaving(true)
      const supabase = createClient()
      const { error } = await supabase.from('users').update({ full_name: fullName }).eq('id', user?.id)
      if (error) throw error
      toast.success('Profile updated')
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPwd.length < 8) { toast.error('Password must be at least 8 characters'); return }
    if (newPwd !== confirmPwd) { toast.error('Passwords do not match'); return }
    try {
      setPwdLoading(true)
      const res = await fetch('/api/auth/change-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPwd }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Password changed successfully')
      setNewPwd(''); setConfirmPwd('')
    } catch (err: any) {
      toast.error(err.message || 'Failed to change password')
    } finally {
      setPwdLoading(false)
    }
  }

  if (dataLoading || !profile) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--text-muted)' }}>
      Loading profile…
    </div>
  )

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="page-header"><h1>Profile Settings</h1><p>Manage your account and security</p></div>

      <SectionCard title="Personal Information" icon={<User size={16} style={{ color: 'var(--accent-blue)' }} />}>
        <div className="space-y-5">
          <div className="flex items-center gap-4">
            <div className="relative cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="Avatar" className="w-16 h-16 rounded-full object-cover" style={{ border: '2px solid var(--border)' }} />
              ) : (
                <Avatar name={profile.full_name} size="xl" />
              )}
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: 'var(--accent-blue)', color: 'white' }}>
                {avatarUploading ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>
            <div>
              <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{profile.full_name}</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{profile.email ?? user?.email}</p>
              <div className="mt-1.5"><RoleBadge role={profile.role || ''} /></div>
            </div>
          </div>
          <Input label="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} />
          <Input label="Email Address" value={profile.email ?? user?.email ?? ''} disabled hint="Email cannot be changed. Contact your admin." />
          <div className="flex justify-end">
            <Button variant="primary" loading={saving} leftIcon={<Save size={15} />} onClick={handleSaveProfile}>Save Changes</Button>
          </div>
        </div>
      </SectionCard>

      {/* Account ID — show for students and teachers */}
      {(profile.role === 'student' || profile.role === 'teacher') && (
        <SectionCard title="Account ID" icon={<Hash size={16} style={{ color: 'var(--accent-green)' }} />}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              This is your unique ID issued by the admin. You can use it to sign in or share it with your admin.
            </p>
            {accountId ? (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px', background: 'var(--bg-secondary)',
                border: '1px solid var(--border)', borderRadius: 10, gap: 12
              }}>
                <code style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '1rem', color: 'var(--accent-blue)', letterSpacing: '0.05em', overflowWrap: 'anywhere' }}>
                  {accountId}
                </code>
                <button
                  onClick={copyId}
                  style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: idCopied ? '#22c55e18' : 'var(--bg-hover)', border: `1px solid ${idCopied ? '#22c55e40' : 'var(--border)'}`, borderRadius: 8, color: idCopied ? '#22c55e' : 'var(--text-secondary)', fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  {idCopied ? <CheckCircle size={14} /> : <Copy size={14} />}
                  {idCopied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            ) : (
              <div style={{ padding: '14px 16px', background: 'var(--bg-hover)', borderRadius: 10, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                No ID found. Contact your admin to generate one.
              </div>
            )}
          </div>
        </SectionCard>
      )}

      <SectionCard title="Change Password" icon={<Lock size={16} style={{ color: 'var(--accent-orange)' }} />}>
        <div className="space-y-4">
          <Input label="New Password" type="password" placeholder="Min 8 characters" value={newPwd} onChange={e => setNewPwd(e.target.value)} />
          <Input label="Confirm Password" type="password" placeholder="Repeat new password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)}
            error={confirmPwd && newPwd !== confirmPwd ? 'Passwords do not match' : undefined} />
          {newPwd && (
            <div>
              <div className="progress-bar">
                <div className="progress-fill" style={{
                  width: newPwd.length < 8 ? '25%' : newPwd.length < 12 ? '60%' : '100%',
                  background: newPwd.length < 8 ? 'var(--accent-red)' : newPwd.length < 12 ? 'var(--accent-orange)' : 'var(--accent-green)',
                  transition: 'width 0.3s ease',
                }} />
              </div>
              <p className="text-xs mt-1" style={{ color: newPwd.length < 8 ? 'var(--accent-red)' : newPwd.length < 12 ? 'var(--accent-orange)' : 'var(--accent-green)' }}>
                {newPwd.length < 8 ? 'Too short' : newPwd.length < 12 ? 'Fair — add more characters' : '✓ Strong password'}
              </p>
            </div>
          )}
          <div className="flex justify-end">
            <Button variant="primary" loading={pwdLoading} leftIcon={<Lock size={15} />} onClick={handleChangePassword}>Update Password</Button>
          </div>
        </div>
      </SectionCard>
    </div>
  )
}