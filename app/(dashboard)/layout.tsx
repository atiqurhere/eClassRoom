import { createClient } from '@/lib/supabase/server'
import { redirect }      from 'next/navigation'
import { ReactNode }     from 'react'
import { DashboardShell } from '@/components/layout/DashboardShell'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let role = 'student'
  const { data: rpcRole, error: rpcErr } = await supabase.rpc('get_my_role')
  if (!rpcErr && rpcRole) {
    role = rpcRole
  } else {
    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    role = profile?.role ?? 'student'
  }

  const { data: profile } = await supabase.from('users').select('full_name').eq('id', user.id).single()

  return (
    <DashboardShell
      role={role}
      userName={profile?.full_name ?? user.email}
      userEmail={user.email}
    >
      {children}
    </DashboardShell>
  )
}
