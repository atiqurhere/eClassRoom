import { createClient } from '@/lib/supabase/client'
import { User, UserRole } from '@/types/database.types'

export const authService = {
  // Sign up a new user
  async signUp(email: string, password: string, fullName: string, role: UserRole, studentId?: string) {
    const supabase = createClient()

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) throw authError
    if (!authData.user) throw new Error('Failed to create user')

    // Create user profile
    const { error: profileError } = await supabase.from('users').insert({
      id: authData.user.id,
      email,
      full_name: fullName,
      role,
    })

    if (profileError) throw profileError

    // If student, create student record
    if (role === 'student' && studentId) {
      const { error: studentError } = await supabase.from('students').insert({
        user_id: authData.user.id,
        student_id: studentId,
      })

      if (studentError) throw studentError
    }

    return authData.user
  },

  // Sign in — returns user, session, and role
  async signIn(email: string, password: string) {
    const supabase = createClient()

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error

    // Use SECURITY DEFINER function to bypass RLS — avoids recursive policy null-role bug
    const { data: role } = await supabase.rpc('get_my_role')
    return { ...data, role: role as string | null }
  },

  // Sign out
  async signOut() {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  // Get current user
  async getCurrentUser() {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // Fetch profile — use RPC for role to bypass recursive RLS, fallback to direct query
    const [profileRes, rpcRes] = await Promise.all([
      supabase.from('users').select('*').eq('id', user.id).single(),
      supabase.rpc('get_my_role'),
    ])

    if (!profileRes.data) return null

    // Prefer the RPC role (bypasses RLS issues), fallback to profile.role
    const role = (!rpcRes.error && rpcRes.data) ? rpcRes.data : profileRes.data.role
    return { ...profileRes.data, role } as User
  },

  // Get current session
  async getSession() {
    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()
    return session
  },

  // Update password
  async updatePassword(newPassword: string) {
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })
    if (error) throw error
  },

  // Reset password
  async resetPassword(email: string) {
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) throw error
  },
}
