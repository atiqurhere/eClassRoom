'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { userSchema, type UserInput } from '@/lib/utils/validators'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Input'
import { createClient } from '@/lib/supabase/client'
import { Users } from 'lucide-react'
import { toast } from 'sonner'

interface UserFormProps {
  onSuccess?: () => void
}

export function UserForm({ onSuccess }: UserFormProps) {
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<UserInput & { password: string; studentId?: string }>({
    defaultValues: { role: 'student' },
  })

  const selectedRole = watch('role')

  const onSubmit = async (data: UserInput & { password: string; studentId?: string }) => {
    try {
      setLoading(true)
      // Call the admin user creation API
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          fullName: data.fullName,
          role: data.role,
          studentId: data.studentId,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast.success('User created successfully!')
      reset()
      if (onSuccess) onSuccess()
    } catch (err: any) {
      toast.error(err.message || 'Failed to create user')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.15)', color: 'var(--accent-green)' }}>
          <Users size={14} />
        </div>
        <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Create New User</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Full Name"
            placeholder="Enter full name"
            error={errors.fullName?.message}
            {...register('fullName', { required: 'Full name is required' })}
          />
          <Input
            label="Email"
            type="email"
            placeholder="Enter email address"
            error={errors.email?.message}
            {...register('email', { required: 'Email is required' })}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Role"
            options={[
              { value: 'student', label: '👨‍🎓 Student' },
              { value: 'teacher', label: '👩‍🏫 Teacher' },
              { value: 'admin', label: '👑 Admin' },
            ]}
            {...register('role')}
          />
          {selectedRole === 'student' && (
            <Input
              label="Student ID (optional)"
              placeholder="e.g. LQA-2026-001"
              {...register('studentId')}
            />
          )}
        </div>

        <div className="rounded-lg px-3 py-2.5" style={{ background: 'rgba(79,142,247,0.08)', border: '1px solid rgba(79,142,247,0.2)' }}>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            <strong>Note:</strong> A password reset email will be sent to the user so they can set their own password.
          </p>
        </div>

        <div className="flex gap-2">
          <Button type="submit" variant="gradient" loading={loading} fullWidth>Create User</Button>
          <Button type="button" variant="secondary" onClick={() => reset()}>Reset</Button>
        </div>
      </form>
    </div>
  )
}