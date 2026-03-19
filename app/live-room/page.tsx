'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { JitsiMeeting } from '@/components/live-class/JitsiMeeting'
import { Video } from 'lucide-react'

function LiveRoomContent() {
  const params      = useSearchParams()
  const roomName    = params.get('room')  || ''
  const userName    = params.get('name')  || 'Participant'
  const userEmail   = params.get('email') || ''
  const isModerator = params.get('mod')   === '1'
  const sessionTitle = params.get('title') || roomName

  if (!roomName) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0f1117', color: '#fff', flexDirection: 'column', gap: 16 }}>
        <Video size={48} style={{ opacity: 0.4 }} />
        <p style={{ opacity: 0.6 }}>No room specified.</p>
      </div>
    )
  }

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: '#0f1117' }}>
      {/* Minimal header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 20px', background: 'rgba(0,0,0,0.6)',
        borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e', display: 'inline-block', boxShadow: '0 0 0 3px rgba(34,197,94,0.3)', animation: 'pulse 2s infinite' }} />
          <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.9375rem' }}>{sessionTitle}</span>
          {isModerator && (
            <span style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(79,142,247,0.2)', color: '#4f8ef7', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em' }}>
              MODERATOR
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem' }}>
            {userName}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.75rem' }}>
            eClassRoom · Live
          </span>
        </div>
      </div>

      {/* Full-height Jitsi */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <JitsiMeeting
          roomName={roomName}
          userName={userName}
          userEmail={userEmail}
          isModerator={isModerator}
          onMeetingEnd={() => {
            // Show a leaving message and close tab after 2s
            document.title = '✅ Session ended — eClassRoom'
            setTimeout(() => window.close(), 2000)
          }}
        />
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 3px rgba(34,197,94,0.3); }
          50%       { box-shadow: 0 0 0 6px rgba(34,197,94,0.1); }
        }
      `}</style>
    </div>
  )
}

export default function LiveRoomPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0f1117', color: 'rgba(255,255,255,0.5)' }}>
        Loading room…
      </div>
    }>
      <LiveRoomContent />
    </Suspense>
  )
}
