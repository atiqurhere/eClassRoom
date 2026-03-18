'use client'

import { useState, useRef } from 'react'
import { User, Lock, Camera, Save, Loader2 } from 'lucide-react'
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
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [saving, setSaving] = useState(false)
  const [pwdLoading, setPwdLoading] = useState(false)
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '')
  const [avatarUploading, setAvatarUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
                <Avatar name={user?.full_name} size="xl" />
              )}
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: 'var(--accent-blue)', color: 'white' }}>
                {avatarUploading ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>
            <div>
              <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{user?.full_name}</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
              <div className="mt-1.5"><RoleBadge role={user?.role || ''} /></div>
            </div>
          </div>
          <Input label="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} />
          <Input label="Email Address" value={user?.email || ''} disabled hint="Email cannot be changed. Contact your admin." />
          <div className="flex justify-end">
            <Button variant="primary" loading={saving} leftIcon={<Save size={15} />} onClick={handleSaveProfile}>Save Changes</Button>
          </div>
        </div>
      </SectionCard>

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