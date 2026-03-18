import Link from 'next/link'
import { BookOpen, Video, Users, Star, Award, Globe, ArrowRight, CheckCircle, MessageCircle } from 'lucide-react'
import type { Viewport } from 'next'

export const viewport: Viewport = { themeColor: '#16a34a' }

export const metadata = {
  title: 'Latifia Quraner Alo — Online Quran Learning Platform',
  description: 'Your trusted online Quran learning platform. Learn Tajweed, Hifz, Tafsir, and more with certified instructors — from anywhere in the world.',
}

const features = [
  {
    icon: <BookOpen size={24} />,
    title: 'Comprehensive Courses',
    desc: 'Tajweed, Hifz, Tafsir, Fiqh, and Islamic Studies — structured from beginner to advanced.',
    color: '#22c55e',
  },
  {
    icon: <Video size={24} />,
    title: 'Live Online Classes',
    desc: 'Interactive face-to-face sessions with qualified teachers via our integrated video platform.',
    color: '#4f8ef7',
  },
  {
    icon: <Star size={24} />,
    title: 'Skilled Instructors',
    desc: 'Certified Quran teachers with years of experience and deep scholarly knowledge.',
    color: '#f59e0b',
  },
  {
    icon: <Globe size={24} />,
    title: 'Worldwide Access',
    desc: 'Learn from the comfort of your home — wherever you are in the world.',
    color: '#8b5cf6',
  },
  {
    icon: <CheckCircle size={24} />,
    title: 'Progress Tracking',
    desc: 'Assignments, grades, and attendance tracked automatically — full transparency.',
    color: '#22c55e',
  },
  {
    icon: <Award size={24} />,
    title: 'Authentic Teaching',
    desc: 'Accurate, meaningful Quranic education built on traditional methods and modern tools.',
    color: '#ef4444',
  },
]

const courses = [
  { name: 'Quran Recitation (Nazira)', level: 'Beginner', duration: '3 Months', badge: '#22c55e' },
  { name: 'Tajweed Rules', level: 'Beginner – Intermediate', duration: '4 Months', badge: '#4f8ef7' },
  { name: 'Hifzul Quran', level: 'Intermediate – Advanced', duration: '1–3 Years', badge: '#f59e0b' },
  { name: 'Tafsir & Meaning', level: 'Intermediate', duration: '6 Months', badge: '#8b5cf6' },
  { name: 'Islamic Studies', level: 'All Levels', duration: 'Ongoing', badge: '#ef4444' },
  { name: 'Arabic Language', level: 'Beginner', duration: '6 Months', badge: '#22c55e' },
]

const stats = [
  { value: '500+', label: 'Active Students' },
  { value: '30+', label: 'Expert Teachers' },
  { value: '15+', label: 'Countries Served' },
  { value: '95%', label: 'Satisfaction Rate' },
]

export default function LandingPage() {
  return (
    <div style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: "'Inter', sans-serif", minHeight: '100vh' }}>

      {/* NAV */}
      <nav style={{ borderBottom: '1px solid var(--border)', background: 'rgba(15,17,23,0.95)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>☪️</div>
            <div>
              <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)', lineHeight: 1.2 }}>Latifia Quraner Alo</p>
              <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Online Quran Learning</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <a href="https://latifiaquranonline.com/" target="_blank" rel="noopener noreferrer"
              style={{ padding: '8px 16px', fontSize: '0.875rem', color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500 }}>
              Main Website
            </a>
            <Link href="/login"
              style={{ padding: '8px 20px', background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff', borderRadius: 8, fontWeight: 600, fontSize: '0.875rem', textDecoration: 'none' }}>
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ position: 'relative', overflow: 'hidden', padding: '100px 24px 80px' }}>
        {/* Background glows */}
        <div style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', background: 'rgba(34,197,94,0.07)', filter: 'blur(100px)', top: -200, left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'rgba(245,158,11,0.06)', filter: 'blur(80px)', bottom: -100, right: '10%', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          {/* Arabic tagline badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 18px', borderRadius: 100, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', marginBottom: 32 }}>
            <span style={{ color: '#22c55e', fontSize: '1rem' }}>☪️</span>
            <span style={{ fontSize: '0.8125rem', color: '#22c55e', fontWeight: 600 }}>بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِیۡمِ</span>
          </div>

          <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 24 }}>
            Your Trusted
            <span style={{ display: 'block', background: 'linear-gradient(135deg, #22c55e 0%, #f59e0b 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Quran Learning Platform
            </span>
          </h1>

          <p style={{ fontSize: 'clamp(1rem, 2vw, 1.25rem)', color: 'var(--text-secondary)', maxWidth: 620, margin: '0 auto 40px', lineHeight: 1.7 }}>
            Latifia Quraner Alo delivers authentic, accurate, and meaningful Quranic education for students of all ages — helping you recite correctly, understand deeply, and apply Quranic teachings in daily life.
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/login"
              style={{ padding: '14px 32px', background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', color: '#fff', borderRadius: 10, fontWeight: 700, fontSize: '1rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 24px rgba(34,197,94,0.3)' }}>
              Start Learning <ArrowRight size={18} />
            </Link>
            <a href="https://latifiaquranonline.com/" target="_blank" rel="noopener noreferrer"
              style={{ padding: '14px 32px', background: 'var(--bg-card)', color: 'var(--text-primary)', borderRadius: 10, fontWeight: 600, fontSize: '1rem', textDecoration: 'none', border: '1px solid var(--border)', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              Visit Main Website
            </a>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section style={{ padding: '0 24px 80px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 20 }}>
          {stats.map(s => (
            <div key={s.label} style={{ textAlign: 'center', padding: '28px 20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16 }}>
              <p style={{ fontSize: '2.25rem', fontWeight: 800, background: 'linear-gradient(135deg, #22c55e, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{s.value}</p>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding: '20px 24px 80px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 12 }}>
              Why Choose Latifia Quraner Alo?
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.0625rem', maxWidth: 500, margin: '0 auto' }}>
              A modern learning platform built around authentic Quranic education
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            {features.map(f => (
              <div key={f.title} style={{ padding: 28, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, transition: 'all 0.2s ease' }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: `${f.color}18`, color: f.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                  {f.icon}
                </div>
                <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>{f.title}</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COURSES */}
      <section style={{ padding: '20px 24px 80px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 12 }}>
              Our Courses
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.0625rem' }}>
              Structured programs for every level
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
            {courses.map(c => (
              <div key={c.name} style={{ padding: '22px 24px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: c.badge, flexShrink: 0, boxShadow: `0 0 10px ${c.badge}80` }} />
                <div>
                  <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{c.name}</p>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{c.level} · {c.duration}</p>
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 36 }}>
            <Link href="/login" style={{ padding: '13px 30px', background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 10, fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '0.9375rem' }}>
              Enroll Now <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section style={{ padding: '20px 24px 80px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 48px', background: 'linear-gradient(135deg, rgba(34,197,94,0.1) 0%, rgba(245,158,11,0.08) 100%)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 24, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'rgba(34,197,94,0.08)', filter: 'blur(60px)', top: -80, right: -80, pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>📖</div>
            <h2 style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.25rem)', fontWeight: 800, marginBottom: 14, letterSpacing: '-0.02em' }}>
              Ready to Begin Your Quran Journey?
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.0625rem', maxWidth: 480, margin: '0 auto 32px', lineHeight: 1.7 }}>
              Join hundreds of students worldwide learning the Quran with authentic, qualified teachers.
            </p>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/login" style={{ padding: '14px 32px', background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', color: '#fff', borderRadius: 10, fontWeight: 700, fontSize: '1rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 20px rgba(34,197,94,0.3)' }}>
                Access E-Classroom <ArrowRight size={18} />
              </Link>
              <a href="https://wa.me/+8801xxxxxxxxx" style={{ padding: '14px 28px', background: 'rgba(37,211,102,0.12)', color: '#25d366', border: '1px solid rgba(37,211,102,0.3)', borderRadius: 10, fontWeight: 600, fontSize: '1rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <MessageCircle size={18} /> WhatsApp Us
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '48px 24px 32px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 40, marginBottom: 48 }}>
            {/* Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #22c55e, #16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>☪️</div>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Latifia Quraner Alo</span>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.7, maxWidth: 260 }}>
                A trusted online Quran learning platform dedicated to authentic and meaningful Quranic education.
              </p>
              <a href="https://latifiaquranonline.com/" target="_blank" rel="noopener noreferrer"
                style={{ fontSize: '0.8125rem', color: '#22c55e', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 12 }}>
                latifiaquranonline.com <ArrowRight size={13} />
              </a>
            </div>

            {/* Platform */}
            <div>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16, fontSize: '0.875rem' }}>Platform</p>
              {[{ label: 'Student Login', href: '/login' }, { label: 'Teacher Login', href: '/login' }, { label: 'Admin Panel', href: '/login' }, { label: 'Create Account', href: '/signup' }].map(l => (
                <div key={l.label} style={{ marginBottom: 10 }}>
                  <Link href={l.href} style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textDecoration: 'none' }}>{l.label}</Link>
                </div>
              ))}
            </div>

            {/* Courses */}
            <div>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16, fontSize: '0.875rem' }}>Courses</p>
              {['Quran Recitation', 'Tajweed Rules', 'Hifzul Quran', 'Tafsir & Meaning', 'Islamic Studies', 'Arabic Language'].map(c => (
                <div key={c} style={{ marginBottom: 10 }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{c}</span>
                </div>
              ))}
            </div>

            {/* Contact */}
            <div>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16, fontSize: '0.875rem' }}>Contact</p>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.6 }}>
                Reach out to join our program or for enrollment inquiries.
              </p>
              <a href="https://latifiaquranonline.com/" target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-block', padding: '9px 18px', background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 8, fontWeight: 600, fontSize: '0.8125rem', textDecoration: 'none' }}>
                Visit Website
              </a>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>© 2026 Latifia Quraner Alo. All rights reserved.</p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Powered by E-Classroom LMS</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
