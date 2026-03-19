'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/lib/store/authStore'
import { createClient } from '@/lib/supabase/client'

/**
 * Fast auth init strategy:
 * 1. Immediately read the local session from Supabase JS cache (synchronous / one network call)
 * 2. If a session exists, fetch the full profile in the background
 * 3. Listen for auth state changes
 *
 * This eliminates the 1-3s delay caused by three sequential network calls in the
 * old authService.getCurrentUser() implementation.
 */
export function useAuth() {
  const { user, loading, setUser, clearAuth } = useAuthStore()

  useEffect(() => {
    const supabase = createClient()
    let cancelled  = false

    const fetchProfile = async (userId: string, email: string) => {
      try {
        const [profileRes, rpcRes] = await Promise.all([
          supabase.from('users').select('*').eq('id', userId).single(),
          supabase.rpc('get_my_role'),
        ])
        if (cancelled) return
        if (!profileRes.data) { clearAuth(); return }
        const role = (!rpcRes.error && rpcRes.data) ? rpcRes.data : profileRes.data.role
        setUser({ ...profileRes.data, role })
      } catch {
        if (!cancelled) clearAuth()
      }
    }

    // Fast path: read cached session (getSession is cheap — no extra network hop)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email ?? '')
      } else {
        clearAuth()
      }
    })

    // Subscribe to future auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email ?? '')
      } else {
        clearAuth()
      }
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [setUser, clearAuth])

  return {
    user,
    loading,
    isAuthenticated:  !!user,
    isAdmin:          user?.role === 'admin',
    isTeacher:        user?.role === 'teacher',
    isStudent:        user?.role === 'student',
  }
}
