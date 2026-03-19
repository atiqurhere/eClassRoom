export const dynamic   = 'force-dynamic'
export const revalidate = 0

import { createClient } from '@/lib/supabase/server'
import { redirect }     from 'next/navigation'
import Link             from 'next/link'

export default async function AdminAssignStudentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get all courses with their enrollment counts
  const { data: courses } = await supabase
    .from('courses')
    .select('id, name, description, course_enrollments(count)')
    .order('name')

  const card = 'var(--bg-card)'
  const bdr  = '1px solid var(--border)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>🎓 Student Enrollment</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: '0.875rem' }}>
          Enroll students in courses. Click a course to manage its student list and classes.
        </p>
      </div>

      {(courses || []).length === 0 ? (
        <div style={{ background: card, border: bdr, borderRadius: 14, padding: 48, textAlign: 'center' }}>
          <p style={{ fontSize: '2rem', marginBottom: 12 }}>📖</p>
          <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>No courses yet</p>
          <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>Create courses first, then enroll students.</p>
          <Link href="/admin/courses"
            style={{ display: 'inline-block', padding: '10px 22px', background: 'linear-gradient(135deg,#4f8ef7,#8b5cf6)', color: '#fff', borderRadius: 10, fontWeight: 700, textDecoration: 'none' }}>
            Go to Courses →
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px,100%),1fr))', gap: 16 }}>
          {(courses || []).map((c: any) => {
            const enrollCount = c.course_enrollments?.[0]?.count ?? 0
            return (
              <Link key={c.id} href={`/admin/courses/${c.id}`}
                style={{ display: 'block', background: card, border: bdr, borderRadius: 14, padding: 20, textDecoration: 'none', transition: 'border-color 0.15s' }}
                className="hover-card">
                <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem', marginBottom: 6 }}>📖 {c.name}</p>
                {c.description && <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 12 }}>{c.description}</p>}
                <div style={{ display: 'flex', gap: 10 }}>
                  <span style={{ fontSize: '0.75rem', padding: '3px 10px', background: 'rgba(79,142,247,0.1)', color: '#4f8ef7', borderRadius: 6, fontWeight: 600 }}>
                    👥 {enrollCount} student{enrollCount !== 1 ? 's' : ''}
                  </span>
                  <span style={{ fontSize: '0.75rem', padding: '3px 10px', background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', borderRadius: 6, fontWeight: 600 }}>
                    Manage →
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
