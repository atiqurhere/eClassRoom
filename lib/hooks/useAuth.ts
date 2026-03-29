'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/lib/store/authStore'
import { authService } from '@/lib/services/auth.service'
import { createClient } from '@/lib/supabase/client'

export function useAuth() {
  const { user, loading, setUser, setLoading, clearAuth } = useAuthStore()

  useEffect(() => {
    // Get initial session
    authService.getCurrentUser()
      .then((user) => {
        setUser(user)
      })
      .catch((error) => {
        console.error('Failed to get current user:', error)
        clearAuth()
      })

    // Listen for auth changes
    const supabase = createClient()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        try {
          const user = await authService.getCurrentUser()
          setUser(user)
        } catch (error) {
          console.error('Failed to get user on auth change:', error)
          clearAuth()
        }
      } else {
        clearAuth()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [setUser, clearAuth])

  return {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isTeacher: user?.role === 'teacher',
    isStudent: user?.role === 'student',
  }
}
