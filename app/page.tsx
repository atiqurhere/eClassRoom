import Link from 'next/link'
import { ArrowRight, CheckCircle, MessageCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Latifia Quraner Alo — Online Quran Learning Platform',
  description: 'Your trusted online Quran learning platform. Learn Tajweed, Hifz, Tafsir, and more with certified instructors — from anywhere in the world.',
}

const features = [
  { title: 'Comprehensive Courses',  desc: 'Tajweed, Hifz, Tafsir, Fiqh, and Islamic Studies — structured from beginner to advanced.', color: '#22c55e', icon: '📖' },
  { title: 'Live Online Classes',     desc: 'Interactive face-to-face sessions with qualified teachers via our integrated video platform.', color: '#4f8ef7', icon: '🎥' },
  { title: 'Skilled Instructors',     desc: 'Certified Quran teachers with years of experience and deep scholarly knowledge.', color: '#f59e0b', icon: '⭐' },
  { title: 'Worldwide Access',        desc: 'Learn from the comfort of your home — wherever you are in the world.', color: '#8b5cf6', icon: '🌍' },
  { title: 'Progress Tracking',       desc: 'Assignments, grades, and attendance tracked automatically — full transparency.', color: '#22c55e', icon: '✅' },
  { title: 'Authentic Teaching',      desc: 'Accurate, meaningful Quranic education built on traditional methods and modern tools.', color: '#ef4444', icon: '🏅' },
]

const courses = [
  { name: 'Quran Recitation (Nazira)', level: 'Beginner',                duration: '3 Months',   badge: '#22c55e' },
  { name: 'Tajweed Rules',             level: 'Beginner – Intermediate', duration: '4 Months',   badge: '#4f8ef7' },
  { name: 'Hifzul Quran',             level: 'Intermediate – Advanced', duration: '1–3 Years',  badge: '#f59e0b' },
  { name: 'Tafsir & Meaning',          level: 'Intermediate',            duration: '6 Months',   badge: '#8b5cf6' },
  { name: 'Islamic Studies',           level: 'All Levels',              duration: 'Ongoing',    badge: '#ef4444' },
  { name: 'Arabic Language',           level: 'Beginner',                duration: '6 Months',   badge: '#22c55e' },
]

const stats = [
  { value: '500+', label: 'Active Students' },
  { value: '30+',  label: 'Expert Teachers' },
  { value: '15+',  label: 'Countries Served' },
  { value: '95%',  label: 'Satisfaction Rate' },
]

const px = 'clamp(16px, 5vw, 48px)'
const maxW: React.CSSProperties = { maxWidth: 1100, margin: '0 auto', width: '100%' }

export default async function LandingPage() {
  // Auth-aware: check if user is already logged in
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let dashboardHref = '/login'
  let isLoggedIn = false
  if (user) {
    isLoggedIn = true
    const { data: rpcRole } = await supabase.rpc('get_my_role')
    dashboardHref = `/${rpcRole ?? 'student'}/dashboard`
  }

  return (
    <div style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: "'Inter', sans-serif", minHeight: '100vh' }}>

      {/* NAV */}
      <nav style={{ borderBottom: '1px solid var(--border)', background: 'rgba(15,17,23,0.97)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ ...maxW, padding: `0 ${px}`, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#22c55e,#16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>☪️</div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontWeight: 700, fontSize: 'clamp(0.7rem, 2.5vw, 0.9375rem)', color: 'var(--text-primary)', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Latifia Quraner Alo</p>
              <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Online Quran Learning</p>
            </div>
          </div>
          {/* Nav Actions — responsive */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {isLoggedIn ? (
              <Link href={dashboardHref}
                style={{ padding: '8px 16px', background: 'linear-gradient(135deg,#22c55e,#16a34a)', color: '#fff', borderRadius: 8, fontWeight: 600, fontSize: 'clamp(0.75rem,2vw,0.875rem)', textDecoration: 'none', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                Dashboard <ArrowRight size={14} />
              </Link>
            ) : (
              <Link href="/login"
                style={{ padding: '8px 16px', background: 'linear-gradient(135deg,#22c55e,#16a34a)', color: '#fff', borderRadius: 8, fontWeight: 600, fontSize: 'clamp(0.75rem,2vw,0.875rem)', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                Sign In
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ position: 'relative', overflow: 'hidden', padding: `clamp(60px,10vw,120px) ${px} clamp(48px,8vw,80px)` }}>
        <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'rgba(34,197,94,0.07)', filter: 'blur(80px)', top: -150, left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none' }} />
        <div style={{ ...maxW, textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 100, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', marginBottom: 28 }}>
            <span style={{ color: '#22c55e', fontSize: '0.9rem' }}>☪️</span>
            <span style={{ fontSize: 'clamp(0.7rem, 2vw, 0.8125rem)', color: '#22c55e', fontWeight: 600 }}>بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِیۡمِ</span>
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 7vw, 4.25rem)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 20 }}>
            Your Trusted
            <span style={{ display: 'block', background: 'linear-gradient(135deg,#22c55e,#f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Quran Learning Platform
            </span>
          </h1>
          <p style={{ fontSize: 'clamp(0.9rem, 2.5vw, 1.125rem)', color: 'var(--text-secondary)', maxWidth: 560, margin: '0 auto 36px', lineHeight: 1.7 }}>
            Latifia Quraner Alo delivers authentic Quranic education for students of all ages — helping you recite correctly, understand deeply, and apply Quranic teachings in daily life.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href={isLoggedIn ? dashboardHref : '/login'}
              style={{ padding: 'clamp(10px,2.5vw,14px) clamp(20px,4vw,32px)', background: 'linear-gradient(135deg,#22c55e,#16a34a)', color: '#fff', borderRadius: 10, fontWeight: 700, fontSize: 'clamp(0.85rem,2vw,1rem)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 24px rgba(34,197,94,0.3)' }}>
              {isLoggedIn ? 'Go to Dashboard' : 'Start Learning'} <ArrowRight size={16} />
            </Link>
            <a href="https://latifiaquranonline.com/" target="_blank" rel="noopener noreferrer"
              style={{ padding: 'clamp(10px,2.5vw,14px) clamp(20px,4vw,32px)', background: 'var(--bg-card)', color: 'var(--text-primary)', borderRadius: 10, fontWeight: 600, fontSize: 'clamp(0.85rem,2vw,1rem)', textDecoration: 'none', border: '1px solid var(--border)', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              Visit Website
            </a>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section style={{ padding: `0 ${px} clamp(48px,8vw,80px)` }}>
        <div style={{ ...maxW, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 14 }}>
          {stats.map(s => (
            <div key={s.label} style={{ textAlign: 'center', padding: 'clamp(18px,3vw,28px) 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14 }}>
              <p style={{ fontSize: 'clamp(1.5rem,4vw,2.25rem)', fontWeight: 800, background: 'linear-gradient(135deg,#22c55e,#f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{s.value}</p>
              <p style={{ fontSize: 'clamp(0.7rem,1.5vw,0.875rem)', color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding: `0 ${px} clamp(48px,8vw,80px)` }}>
        <div style={maxW}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ fontSize: 'clamp(1.5rem,4vw,2.5rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 10 }}>Why Choose Us?</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 'clamp(0.875rem,2vw,1rem)', maxWidth: 460, margin: '0 auto' }}>A modern learning platform built around authentic Quranic education</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))', gap: 16 }}>
            {features.map(f => (
              <div key={f.title} style={{ padding: 'clamp(18px,3vw,28px)', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14 }}>
                <div style={{ width: 46, height: 46, borderRadius: 12, background: `${f.color}18`, color: f.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', marginBottom: 14 }}>{f.icon}</div>
                <h3 style={{ fontSize: 'clamp(0.9rem,2vw,1.0625rem)', fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)' }}>{f.title}</h3>
                <p style={{ fontSize: 'clamp(0.8rem,1.5vw,0.9rem)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COURSES */}
      <section style={{ padding: `0 ${px} clamp(48px,8vw,80px)` }}>
        <div style={maxW}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <h2 style={{ fontSize: 'clamp(1.5rem,4vw,2.5rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 10 }}>Our Courses</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 'clamp(0.875rem,2vw,1rem)' }}>Structured programs for every level</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))', gap: 14 }}>
            {courses.map(c => (
              <div key={c.name} style={{ padding: 'clamp(14px,2.5vw,22px) clamp(14px,2.5vw,22px)', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: c.badge, flexShrink: 0, boxShadow: `0 0 8px ${c.badge}80` }} />
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 'clamp(0.8rem,1.8vw,0.9375rem)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</p>
                  <p style={{ fontSize: 'clamp(0.7rem,1.5vw,0.8125rem)', color: 'var(--text-muted)', marginTop: 2 }}>{c.level} · {c.duration}</p>
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 28 }}>
            <Link href="/login" style={{ padding: '12px 28px', background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 10, fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '0.9375rem' }}>
              Enroll Now <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: `0 ${px} clamp(48px,8vw,80px)` }}>
        <div style={{ ...maxW, padding: 'clamp(32px,6vw,60px) clamp(20px,5vw,48px)', background: 'linear-gradient(135deg,rgba(34,197,94,0.1),rgba(245,158,11,0.08))', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 'clamp(1.75rem,4vw,2.5rem)', marginBottom: 14 }}>📖</div>
          <h2 style={{ fontSize: 'clamp(1.25rem,4vw,2.25rem)', fontWeight: 800, marginBottom: 12, letterSpacing: '-0.02em' }}>Ready to Begin Your Quran Journey?</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'clamp(0.875rem,2vw,1.0625rem)', maxWidth: 440, margin: '0 auto 28px', lineHeight: 1.7 }}>
            Join hundreds of students worldwide learning the Quran with authentic, qualified teachers.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/login" style={{ padding: 'clamp(10px,2.5vw,14px) clamp(20px,4vw,32px)', background: 'linear-gradient(135deg,#22c55e,#16a34a)', color: '#fff', borderRadius: 10, fontWeight: 700, fontSize: 'clamp(0.85rem,2vw,1rem)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 20px rgba(34,197,94,0.3)' }}>
              Access E-Classroom <ArrowRight size={16} />
            </Link>
            <a href="https://wa.me/+8801xxxxxxxxx" style={{ padding: 'clamp(10px,2.5vw,14px) clamp(20px,4vw,28px)', background: 'rgba(37,211,102,0.12)', color: '#25d366', border: '1px solid rgba(37,211,102,0.3)', borderRadius: 10, fontWeight: 600, fontSize: 'clamp(0.85rem,2vw,1rem)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <MessageCircle size={16} /> WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: `clamp(32px,5vw,48px) ${px} clamp(20px,3vw,32px)` }}>
        <div style={maxW}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px,100%), 1fr))', gap: 'clamp(24px,4vw,40px)', marginBottom: 36 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#22c55e,#16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>☪️</div>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>Latifia Quraner Alo</span>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>A trusted online Quran learning platform.</p>
              <a href="https://latifiaquranonline.com/" target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8125rem', color: '#22c55e', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 10 }}>
                latifiaquranonline.com <ArrowRight size={12} />
              </a>
            </div>
            <div>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 14, fontSize: '0.875rem' }}>Platform</p>
              {[{ label: 'Student Login', href: '/login' }, { label: 'Teacher Login', href: '/login' }, { label: 'Admin Panel', href: '/login' }].map(l => (
                <div key={l.label} style={{ marginBottom: 8 }}>
                  <Link href={l.href} style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textDecoration: 'none' }}>{l.label}</Link>
                </div>
              ))}
            </div>
            <div>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 14, fontSize: '0.875rem' }}>Courses</p>
              {['Quran Recitation', 'Tajweed Rules', 'Hifzul Quran', 'Tafsir & Meaning'].map(c => (
                <div key={c} style={{ marginBottom: 8 }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{c}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>© 2026 Latifia Quraner Alo. All rights reserved.</p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Powered by E-Classroom LMS</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
