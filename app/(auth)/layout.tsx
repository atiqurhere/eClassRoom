import { ReactNode } from 'react'
import { BookOpen, Users, Video, Star } from 'lucide-react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-primary)' }}>
      {/* Left panel - Latifia branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)' }}>
        {/* Glow effects - green for Islamic theme */}
        <div style={{
          position: 'absolute', width: 400, height: 400, borderRadius: '50%',
          background: 'rgba(34, 197, 94, 0.12)', filter: 'blur(80px)',
          top: -120, left: -80, pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', width: 350, height: 350, borderRadius: '50%',
          background: 'rgba(245,158,11,0.08)', filter: 'blur(80px)',
          bottom: -80, right: -60, pointerEvents: 'none',
        }} />

        {/* Brand */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-14">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
              style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', flexShrink: 0 }}>
              ☪️
            </div>
            <div>
              <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Latifia Quraner Alo</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Online Quran Learning Platform</p>
            </div>
          </div>

          <h2 className="text-4xl font-bold mb-5 leading-tight" style={{ color: 'var(--text-primary)' }}>
            Learn the Quran<br />
            <span style={{
              background: 'linear-gradient(135deg, #22c55e 0%, #f59e0b 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              the right way
            </span>
          </h2>
          <p className="text-base leading-relaxed" style={{ color: 'var(--text-secondary)', maxWidth: 380 }}>
            Authentic Quranic education for students of all ages — from proper recitation to deep understanding.
          </p>
        </div>

        {/* Feature cards */}
        <div className="relative z-10 space-y-3">
          {[
            { icon: <BookOpen size={18} />, title: 'Comprehensive Courses', desc: 'Tajweed, Hifz, Tafsir & Islamic Studies', color: 'var(--accent-green)' },
            { icon: <Video size={18} />, title: 'Live Online Classes', desc: 'Face-to-face sessions with qualified teachers', color: 'var(--accent-blue)' },
            { icon: <Users size={18} />, title: 'Worldwide Access', desc: 'Learn from anywhere, anytime', color: 'var(--accent-orange)' },
            { icon: <Star size={18} />, title: 'Skilled Instructors', desc: 'Certified Quran teachers with years of experience', color: 'var(--accent-purple)' },
          ].map((f) => (
            <div key={f.title} className="flex items-center gap-4 p-3 rounded-xl glass-card">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${f.color}20`, color: f.color }}>
                {f.icon}
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{f.title}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs relative z-10" style={{ color: 'var(--text-muted)' }}>
          © 2026 Latifia Quraner Alo. All rights reserved.
        </p>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
        <div style={{
          position: 'absolute', width: 300, height: 300, borderRadius: '50%',
          background: 'rgba(34,197,94,0.06)', filter: 'blur(60px)',
          top: -60, right: -40, pointerEvents: 'none',
        }} />
        <div className="w-full max-w-md relative z-10">
          {/* Mobile brand */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl"
              style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' }}>
              ☪️
            </div>
            <p className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Latifia Quraner Alo</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
