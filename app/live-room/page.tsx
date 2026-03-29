'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { ZoomLauncher } from '@/components/live-class/ZoomLauncher'
import { Video } from 'lucide-react'

function LiveRoomContent() {
  const params       = useSearchParams()
  const zoomUrl      = params.get('zoom')  || ''
  const userName     = params.get('name')  || 'Participant'
  const isModerator  = params.get('mod')   === '1'
  const sessionTitle = params.get('title') || 'Live Class'

  if (!zoomUrl) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0f1117', color: '#fff', flexDirection: 'column', gap: 16 }}>
        <Video size={48} style={{ opacity: 0.4 }} />
        <p style={{ opacity: 0.6 }}>No Zoom URL provided.</p>
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#0f1117' }}>
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
            <span style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(37,150,252,0.2)', color: '#2596fc', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em' }}>
              HOST
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem' }}>{userName}</span>
          <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.75rem' }}>eClassRoom · Zoom</span>
        </div>
      </div>

      {/* ZoomLauncher fills the rest */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <ZoomLauncher
          zoomUrl={zoomUrl}
          userName={userName}
          sessionTitle={sessionTitle}
          isModerator={isModerator}
          onDismiss={() => {
            document.title = 'eClassRoom'
            window.close()
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
        Loading…
      </div>
    }>
      <LiveRoomContent />
    </Suspense>
  )
}
