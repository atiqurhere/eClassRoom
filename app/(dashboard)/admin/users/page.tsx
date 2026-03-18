'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Pencil, Trash2, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { RoleBadge } from '@/components/ui/Badge'
import { AvatarWithName } from '@/components/ui/Avatar'
import { SectionCard } from '@/components/ui/Card'
import { Skeleton, SkeletonRow } from '@/components/ui/Loading'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'

interface User {
  id: string
  email: string
  full_name: string
  role: string
  created_at: string
  student_id?: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [deleteUser, setDeleteUser] = useState<User | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<any>()

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('users')
      .select('id, email, full_name, role, created_at')
      .order('created_at', { ascending: false })
    setUsers(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const filtered = users.filter(u => {
    const matchSearch = !search || u.full_name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
    const matchRole = !roleFilter || u.role === roleFilter
    return matchSearch && matchRole
  })

  const handleCreate = async (data: any) => {
    try {
      setSaving(true)
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast.success('User created successfully')
      setShowCreateModal(false)
      reset()
      fetchUsers()
    } catch (err: any) {
      toast.error(err.message || 'Failed to create user')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async (data: any) => {
    if (!editUser) return
    try {
      setSaving(true)
      const supabase = createClient()
      const { error } = await supabase
        .from('users')
        .update({ full_name: data.full_name, role: data.role })
        .eq('id', editUser.id)
      if (error) throw error
      toast.success('User updated')
      setEditUser(null)
      fetchUsers()
    } catch (err: any) {
      toast.error(err.message || 'Failed to update user')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteUser) return
    try {
      setDeleting(true)
      const res = await fetch(`/api/admin/users?id=${deleteUser.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      toast.success('User deleted')
      setDeleteUser(null)
      fetchUsers()
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete user')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1>User Management</h1>
          <p>Manage all students, teachers, and admins</p>
        </div>
        <Button variant="gradient" leftIcon={<Plus size={16} />} onClick={() => { reset(); setShowCreateModal(true) }}>
          Add User
        </Button>
      </div>

      <SectionCard
        title={`All Users (${filtered.length})`}
        icon={undefined}
        action={
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="form-input pl-8 text-sm"
                style={{ width: 200, padding: '7px 12px 7px 32px', fontSize: '0.8125rem' }}
              />
            </div>
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="form-select text-sm"
              style={{ width: 130, padding: '7px 30px 7px 12px', fontSize: '0.8125rem' }}
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="teacher">Teacher</option>
              <option value="student">Student</option>
            </select>
            <button onClick={fetchUsers} className="p-2 rounded-lg transition-colors" style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}>
              <RefreshCw size={15} />
            </button>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                    No users found
                  </td>
                </tr>
              ) : (
                filtered.map(u => (
                  <tr key={u.id}>
                    <td><AvatarWithName name={u.full_name} size="sm" /></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>{u.email}</td>
                    <td><RoleBadge role={u.role} /></td>
                    <td style={{ fontSize: '0.8125rem' }}>
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setEditUser(u); reset({ full_name: u.full_name, role: u.role }) }}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ color: 'var(--accent-blue)', background: 'rgba(79,142,247,0.1)' }}
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => setDeleteUser(u)}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ color: 'var(--accent-red)', background: 'rgba(239,68,68,0.1)' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Create Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New User" size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button variant="gradient" loading={saving} onClick={handleSubmit(handleCreate)}>Create User</Button>
          </>
        }
      >
        <form className="space-y-4">
          <Input label="Full Name" placeholder="John Doe" error={errors.full_name?.message as string} {...register('full_name', { required: 'Name is required' })} />
          <Input label="Email Address" type="email" placeholder="john@school.edu" error={errors.email?.message as string} {...register('email', { required: 'Email is required' })} />
          <Input label="Password" type="password" placeholder="Min 8 characters" error={errors.password?.message as string} {...register('password', { required: true, minLength: 8 })} />
          <Select
            label="Role"
            options={[{ value: 'student', label: '👨‍🎓 Student' }, { value: 'teacher', label: '👩‍🏫 Teacher' }, { value: 'admin', label: '👑 Admin' }]}
            placeholder="Select role"
            error={errors.role?.message as string}
            {...register('role', { required: 'Role is required' })}
          />
          <Input label="Student ID (optional, for students)" placeholder="STU-2026-001" {...register('student_id')} />
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editUser} onClose={() => setEditUser(null)} title="Edit User" size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditUser(null)}>Cancel</Button>
            <Button variant="gradient" loading={saving} onClick={handleSubmit(handleUpdate)}>Save Changes</Button>
          </>
        }
      >
        <form className="space-y-4">
          <Input label="Full Name" {...register('full_name', { required: true })} />
          <Select
            label="Role"
            options={[{ value: 'student', label: '👨‍🎓 Student' }, { value: 'teacher', label: '👩‍🏫 Teacher' }, { value: 'admin', label: '👑 Admin' }]}
            {...register('role')}
          />
        </form>
      </Modal>

      {/* Delete confirm */}
      <ConfirmModal
        isOpen={!!deleteUser}
        onClose={() => setDeleteUser(null)}
        onConfirm={handleDelete}
        title="Delete User"
        message={`Are you sure you want to delete ${deleteUser?.full_name}? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={deleting}
      />
    </div>
  )
}