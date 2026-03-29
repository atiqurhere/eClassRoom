'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { User, Camera, Lock, Bell } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

interface ProfileFormData {
  fullName: string
  email: string
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export default function ProfilePage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [uploading, setUploading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<ProfileFormData>({
    defaultValues: {
      fullName: user?.full_name || '',
      email: user?.email || '',
    },
  })

  const newPassword = watch('newPassword')

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)

      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'avatar')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      toast.success('Avatar updated successfully!')
      // In a real app, you'd refetch user data or update the store
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload avatar')
    } finally {
      setUploading(false)
    }
  }

  const onProfileSubmit = async (data: ProfileFormData) => {
    try {
      // In a real app, update user profile
      console.log('Updating profile:', data)
      toast.success('Profile updated successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile')
    }
  }

  const onPasswordSubmit = async (data: ProfileFormData) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error("Passwords don't match")
      return
    }

    try {
      // In a real app, update password
      console.log('Updating password')
      toast.success('Password updated successfully!')
      reset({
        ...data,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    } catch (error: any) {
      toast.error(error.message || 'Failed to update password')
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account settings and preferences</p>
      </div>

      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={32} className="text-gray-400" />
                )}
              </div>
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 bg-primary-600 text-white p-2 rounded-full cursor-pointer hover:bg-primary-700 transition-colors"
              >
                <Camera size={16} />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </label>
              {uploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{user?.full_name}</h2>
              <p className="text-gray-600">{user?.email}</p>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800 mt-2">
                {user?.role?.charAt(0).toUpperCase()}{user?.role?.slice(1)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'profile', label: 'Profile', icon: User },
            { id: 'password', label: 'Password', icon: Lock },
            { id: 'notifications', label: 'Notifications', icon: Bell },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon size={16} />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'profile' && (
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onProfileSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  error={errors.fullName?.message}
                  {...register('fullName', { required: 'Full name is required' })}
                />
                <Input
                  label="Email"
                  type="email"
                  error={errors.email?.message}
                  {...register('email', { required: 'Email is required' })}
                />
              </div>
              <Button type="submit">Update Profile</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {activeTab === 'password' && (
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onPasswordSubmit)} className="space-y-4">
              <Input
                label="Current Password"
                type="password"
                error={errors.currentPassword?.message}
                {...register('currentPassword', { required: 'Current password is required' })}
              />
              <Input
                label="New Password"
                type="password"
                error={errors.newPassword?.message}
                {...register('newPassword', {
                  required: 'New password is required',
                  minLength: { value: 8, message: 'Password must be at least 8 characters' },
                })}
              />
              <Input
                label="Confirm Password"
                type="password"
                error={errors.confirmPassword?.message}
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: value => value === newPassword || "Passwords don't match",
                })}
              />
              <Button type="submit">Update Password</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {activeTab === 'notifications' && (
        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { id: 'email_assignments', label: 'Email notifications for new assignments' },
                { id: 'email_grades', label: 'Email notifications for grades' },
                { id: 'email_classes', label: 'Email notifications for live classes' },
                { id: 'push_assignments', label: 'Push notifications for assignments' },
                { id: 'push_grades', label: 'Push notifications for grades' },
                { id: 'push_classes', label: 'Push notifications for live classes' },
              ].map((setting) => (
                <div key={setting.id} className="flex items-center justify-between">
                  <label htmlFor={setting.id} className="text-sm font-medium text-gray-700">
                    {setting.label}
                  </label>
                  <input
                    id={setting.id}
                    type="checkbox"
                    defaultChecked
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                </div>
              ))}
            </div>
            <div className="pt-4">
              <Button>Save Preferences</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}