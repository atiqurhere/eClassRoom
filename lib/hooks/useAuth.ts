'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/lib/store/authStore'
import { authService } from '@/lib/services/auth.service'
import { createClient } from '@/lib/supabase/client'

export function useAuth() {
  const { user, loading, setUser, setLoading, clearAuth } = useAuthStore()

  useEffect(() => {
    // Get initial session — always clear loading in finally
    const init = async () => {
      try {
        const user = await authService.getCurrentUser()
        setUser(user)
      } catch {
        clearAuth()
      }
    }
    init()

    // Listen for auth changes
    const supabase = createClient()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        try {
          const user = await authService.getCurrentUser()
          setUser(user)
        } catch {
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
