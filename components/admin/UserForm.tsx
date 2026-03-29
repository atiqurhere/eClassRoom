'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { userSchema, type UserInput } from '@/lib/utils/validators'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { authService } from '@/lib/services/auth.service'
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
    resolver: zodResolver(userSchema.extend({
      password: userSchema.shape.email,
      studentId: userSchema.shape.email.optional(),
    })),
    defaultValues: {
      role: 'student',
    },
  })

  const selectedRole = watch('role')

  const onSubmit = async (data: UserInput & { password: string; studentId?: string }) => {
    try {
      setLoading(true)

      // Generate a temporary password
      const tempPassword = `temp${Math.random().toString(36).substr(2, 8)}`

      await authService.signUp(
        data.email,
        tempPassword,
        data.fullName,
        data.role,
        data.studentId
      )

      toast.success('User created successfully! Temporary password sent to email.')
      reset()
      if (onSuccess) onSuccess()
    } catch (error: any) {
      toast.error(error.message || 'Failed to create user')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New User</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              placeholder="Enter full name"
              error={errors.fullName?.message}
              {...register('fullName')}
            />

            <Input
              label="Email"
              type="email"
              placeholder="Enter email address"
              error={errors.email?.message}
              {...register('email')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                {...register('role')}
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </select>
              {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>}
            </div>

            {selectedRole === 'student' && (
              <Input
                label="Student ID"
                placeholder="Enter student ID"
                error={errors.studentId?.message}
                {...register('studentId')}
              />
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-blue-800 text-sm">
              <strong>Note:</strong> A temporary password will be generated and sent to the user's email.
              They can change it after their first login.
            </p>
          </div>

          <div className="flex space-x-3">
            <Button type="submit" loading={loading} className="flex-1">
              Create User
            </Button>
            <Button type="button" variant="secondary" onClick={() => reset()}>
              Reset
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}