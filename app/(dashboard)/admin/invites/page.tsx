export const dynamic   = 'force-dynamic'
export const revalidate = 0

import { createClient }  from '@/lib/supabase/server'
import { redirect }      from 'next/navigation'
import InvitesClient     from './InvitesClient'

export default async function InvitesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: role } = await supabase.rpc('get_my_role')
  if (role !== 'admin') redirect(`/${role ?? 'student'}/dashboard`)

  // Fetch invite lists
  const [{ data: studentInvites }, { data: teacherInvites }, { data: classes }] = await Promise.all([
    supabase.from('student_invites').select('*').order('created_at', { ascending: false }),
    supabase.from('teacher_invites').select('*').order('created_at', { ascending: false }),
    supabase.from('classes').select('id, class_name, section').order('class_name'),
  ])

  return (
    <InvitesClient
      studentInvites={studentInvites ?? []}
      teacherInvites={teacherInvites ?? []}
      classes={classes ?? []}
      adminId={user.id}
    />
  )
}
