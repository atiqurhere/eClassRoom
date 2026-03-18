import { createClient } from '@/lib/supabase/server'
import { redirect }      from 'next/navigation'
import { ReactNode }     from 'react'
import { Sidebar }       from '@/components/layout/Sidebar'
import { Header }        from '@/components/layout/Header'

// Server component — no client-side loading spinner, no hanging promises
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()

  // Get user from server — safe, uses HttpOnly cookies on the server context
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get role: try the SECURITY DEFINER RPC first, then fallback to direct query
  let role = 'student'
  const { data: rpcRole, error: rpcErr } = await supabase.rpc('get_my_role')
  if (!rpcErr && rpcRole) {
    role = rpcRole
  } else {
    const { data: profile } = await supabase
      .from('users').select('role').eq('id', user.id).single()
    role = profile?.role ?? 'student'
  }

  // Get display name
  const { data: profile } = await supabase
    .from('users').select('full_name').eq('id', user.id).single()

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      <Sidebar
        role={role}
        userName={profile?.full_name ?? user.email}
        userEmail={user.email}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
