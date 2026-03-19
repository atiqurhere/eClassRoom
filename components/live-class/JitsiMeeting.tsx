'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Loader2, Mic, MicOff, Video, VideoOff, Monitor, PhoneOff } from 'lucide-react'

declare global {
  interface Window {
    JitsiMeetExternalAPI: any
  }
}

export interface JitsiMeetingProps {
  roomName: string
  userName: string
  userEmail: string
  isModerator?: boolean      // teachers & admins get moderator toolbar + recording
  onMeetingEnd?: () => void
}

const JITSI_DOMAIN = process.env.NEXT_PUBLIC_JITSI_DOMAIN || 'meet.jit.si'

// Full moderator toolbar
const MODERATOR_BUTTONS = [
  'microphone', 'camera', 'desktop', 'fullscreen',
  'fodeviceselection', 'hangup', 'chat', 'recording',
  'livestreaming', 'settings', 'raisehand', 'videoquality',
  'filmstrip', 'feedback', 'stats', 'shortcuts', 'tileview',
  'download', 'mute-everyone', 'security',
]

// Participant toolbar (no recording/mute-everyone)
const PARTICIPANT_BUTTONS = [
  'microphone', 'camera', 'desktop', 'fullscreen',
  'fodeviceselection', 'hangup', 'chat', 'raisehand',
  'videoquality', 'tileview', 'download', 'feedback',
]

export function JitsiMeeting({
  roomName,
  userName,
  userEmail,
  isModerator = false,
  onMeetingEnd,
}: JitsiMeetingProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const apiRef       = useRef<any>(null)
  const [status, setStatus]   = useState<'loading' | 'ready' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState('')

  const initJitsi = useCallback(() => {
    if (!containerRef.current || !window.JitsiMeetExternalAPI) return

    // Clean up any existing instance
    if (apiRef.current) {
      try { apiRef.current.dispose() } catch {}
      apiRef.current = null
    }

    try {
      apiRef.current = new window.JitsiMeetExternalAPI(JITSI_DOMAIN, {
        roomName,
        width:      '100%',
        height:     '100%',
        parentNode: containerRef.current,
        userInfo: {
          displayName: userName,
          email:       userEmail,
        },
        configOverwrite: {
          // Audio/video defaults
          startWithAudioMuted:        false,
          startWithVideoMuted:        false,
          // User experience
          enableWelcomePage:          false,
          prejoinPageEnabled:         false,
          disableDeepLinking:         true,
          // Moderator: grant moderator to whoever has the flag
          // On public meet.jit.si the first joiner becomes moderator automatically
          // We set the subject so the room is named after the class
          subject:                    roomName,
          // Recording options
          fileRecordingsEnabled:      isModerator,
          liveStreamingEnabled:       isModerator,
          localRecording: {
            enabled: isModerator,
            notifyAllParticipants: true,
          },
          // Security
          enableNoAudioDetection:     true,
          enableNoisyMicDetection:    true,
          // Tile view by default looks better for classes
          defaultLocalDisplayName:    userName,
          defaultRemoteDisplayName:   'Student',
          disableModeratorIndicator:  false,
          // Let teacher see who raised hand
          disableReactions:           false,
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK:           false,
          SHOW_WATERMARK_FOR_GUESTS:      false,
          SHOW_BRAND_WATERMARK:           false,
          DEFAULT_REMOTE_DISPLAY_NAME:    'Participant',
          TOOLBAR_BUTTONS:                isModerator ? MODERATOR_BUTTONS : PARTICIPANT_BUTTONS,
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: false,
          HIDE_DEEP_LINKING_LOGO:         true,
          MOBILE_APP_PROMO:               false,
        },
      })

      apiRef.current.addListener('videoConferenceJoined', () => {
        setStatus('ready')
        // On public meet.jit.si the first joiner or anyone who entered before
        // can be granted moderator. We can't force JWT auth on the free server,
        // but we can attempt to grant moderator via the API if the room has already
        // elected a moderator:
        if (isModerator) {
          // Try to elevate self to moderator (works if already moderator or on self-hosted Jitsi)
          try { apiRef.current.executeCommand('toggleLobby', false) } catch {}
        }
      })

      apiRef.current.addListener('videoConferenceLeft', () => {
        onMeetingEnd?.()
      })

      apiRef.current.addListener('readyToClose', () => {
        onMeetingEnd?.()
      })

      apiRef.current.addListener('errorOccurred', (e: any) => {
        console.error('Jitsi error:', e)
      })
    } catch (err: any) {
      console.error('Jitsi init error:', err)
      setErrorMsg('Failed to initialise video call. Please refresh.')
      setStatus('error')
    }
  }, [roomName, userName, userEmail, isModerator, onMeetingEnd])

  useEffect(() => {
    // Avoid double-loading the script
    const existing = document.getElementById('jitsi-api-script')
    if (existing) {
      if (window.JitsiMeetExternalAPI) initJitsi()
      else existing.addEventListener('load', initJitsi)
      return
    }

    const script   = document.createElement('script')
    script.id      = 'jitsi-api-script'
    script.src     = `https://${JITSI_DOMAIN}/external_api.js`
    script.async   = true
    script.onload  = () => initJitsi()
    script.onerror = () => {
      setErrorMsg('Could not load Jitsi. Check your internet connection and refresh.')
      setStatus('error')
    }
    document.head.appendChild(script)

    return () => {
      if (apiRef.current) {
        try { apiRef.current.dispose() } catch {}
        apiRef.current = null
      }
    }
  }, [initJitsi])

  if (status === 'error') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: 'var(--bg-hover)', borderRadius: 12 }}>
        <div style={{ textAlign: 'center', padding: 32 }}>
          <Video size={40} style={{ margin: '0 auto 12px', color: 'var(--accent-red)', opacity: 0.6 }} />
          <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>Unable to load video</p>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 20, maxWidth: 320 }}>{errorMsg}</p>
          <button onClick={() => { setStatus('loading'); setErrorMsg(''); initJitsi() }}
            style={{ padding: '8px 20px', background: 'linear-gradient(135deg,#4f8ef7,#8b5cf6)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {status === 'loading' && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-hover)', borderRadius: 12, zIndex: 10 }}>
          <div style={{ textAlign: 'center' }}>
            <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent-blue)', margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Connecting to live class…</p>
          </div>
        </div>
      )}
      <div ref={containerRef} style={{ width: '100%', height: '100%', borderRadius: 12, overflow: 'hidden' }} />
    </div>
  )
}
