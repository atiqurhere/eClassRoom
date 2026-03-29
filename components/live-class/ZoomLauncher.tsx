'use client'

import { useEffect, useState } from 'react'
import { Video, ExternalLink, Loader2, AlertCircle } from 'lucide-react'

export interface ZoomLauncherProps {
  /** The Zoom join URL (for students) or start URL (for teachers) */
  zoomUrl: string
  /** User's display name */
  userName: string
  /** Class title shown on the waiting screen */
  sessionTitle: string
  /** Is this user the host/moderator? */
  isModerator?: boolean
  /** Called when the user manually dismisses the launch screen */
  onDismiss?: () => void
}

/**
 * ZoomLauncher — opens the Zoom URL and shows a friendly "launching" screen.
 * Zoom runs in its own native app or browser tab — not embedded in an iframe.
 */
export function ZoomLauncher({
  zoomUrl,
  userName,
  sessionTitle,
  isModerator = false,
  onDismiss,
}: ZoomLauncherProps) {
  const [launched, setLaunched] = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  const launch = () => {
    if (!zoomUrl) {
      setError('Zoom meeting URL is not available. Please try again or contact your teacher.')
      return
    }
    try {
      window.open(zoomUrl, '_blank', 'noopener,noreferrer')
      setLaunched(true)
    } catch {
      setError('Could not open Zoom. Please allow popups or click the button below.')
    }
  }

  // Auto-launch on mount
  useEffect(() => {
    const timer = setTimeout(launch, 800)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div style={{
      width: '100%', height: '100%', minHeight: 400,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary, #0f1117)',
      gap: 24, padding: 32, textAlign: 'center',
    }}>
      {/* Animated icon */}
      <div style={{
        width: 88, height: 88, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(37, 150, 252, 0.12)',
        border: '2px solid rgba(37, 150, 252, 0.25)',
        animation: launched ? 'none' : 'zoomPulse 2s ease-in-out infinite',
      }}>
        {launched
          ? <Video size={36} style={{ color: '#2596fc' }} />
          : <Loader2 size={36} style={{ color: '#2596fc', animation: 'spin 1.2s linear infinite' }} />
        }
      </div>

      {/* Text */}
      <div style={{ maxWidth: 420 }}>
        <h2 style={{ color: 'var(--text-primary, #fff)', fontWeight: 700, fontSize: '1.25rem', marginBottom: 8 }}>
          {launched ? 'Zoom is opening…' : 'Launching Zoom…'}
        </h2>
        <p style={{ color: 'var(--text-muted, rgba(255,255,255,0.55))', fontSize: '0.9rem', lineHeight: 1.6 }}>
          {isModerator
            ? `You are joining as host for "${sessionTitle}".`
            : `You are joining "${sessionTitle}" as ${userName}.`
          }
          {launched && ' If Zoom did not open, click the button below.'}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 16px', borderRadius: 10,
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          color: '#f87171', fontSize: '0.85rem', maxWidth: 400,
        }}>
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          {error}
        </div>
      )}

      {/* Manual launch button */}
      <button
        onClick={launch}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '12px 28px', borderRadius: 10,
          background: '#2596fc', color: '#fff',
          border: 'none', cursor: 'pointer',
          fontWeight: 700, fontSize: '0.9375rem',
          transition: 'opacity 0.15s',
        }}
        onMouseOver={e => ((e.target as HTMLElement).style.opacity = '0.85')}
        onMouseOut={e  => ((e.target as HTMLElement).style.opacity = '1')}
      >
        <ExternalLink size={16} />
        {isModerator ? 'Open Zoom (Host)' : 'Open Zoom (Join)'}
      </button>

      {onDismiss && (
        <button
          onClick={onDismiss}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted, rgba(255,255,255,0.4))',
            fontSize: '0.8125rem', textDecoration: 'underline',
          }}
        >
          Go back to dashboard
        </button>
      )}

      <style>{`
        @keyframes zoomPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(37,150,252,0.3); }
          50%       { box-shadow: 0 0 0 16px rgba(37,150,252,0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
