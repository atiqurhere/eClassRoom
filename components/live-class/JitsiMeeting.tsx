'use client'

import { useEffect, useRef, useCallback } from 'react'
import { Video } from 'lucide-react'

declare global {
  interface Window {
    JitsiMeetExternalAPI: any
  }
}

export interface JitsiMeetingProps {
  roomName: string
  userName: string
  userEmail: string
  isModerator?: boolean
  onMeetingEnd?: () => void
}

const JITSI_DOMAIN = process.env.NEXT_PUBLIC_JITSI_DOMAIN || 'meet.jit.si'

const MODERATOR_BUTTONS = [
  'microphone', 'camera', 'desktop', 'fullscreen',
  'fodeviceselection', 'hangup', 'chat', 'recording',
  'livestreaming', 'settings', 'raisehand', 'videoquality',
  'filmstrip', 'feedback', 'stats', 'shortcuts', 'tileview',
  'download', 'mute-everyone', 'security',
]

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

  const initJitsi = useCallback(() => {
    if (!containerRef.current || !window.JitsiMeetExternalAPI) return

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
          startWithAudioMuted:     false,
          startWithVideoMuted:     false,
          enableWelcomePage:       false,
          prejoinPageEnabled:      false,
          disableDeepLinking:      true,
          subject:                 roomName,
          fileRecordingsEnabled:   isModerator,
          liveStreamingEnabled:    isModerator,
          localRecording: {
            enabled:               isModerator,
            notifyAllParticipants: true,
          },
          enableNoAudioDetection:  true,
          enableNoisyMicDetection: true,
          defaultLocalDisplayName: userName,
          defaultRemoteDisplayName: 'Student',
          disableModeratorIndicator: false,
          disableReactions:        false,
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK:             false,
          SHOW_WATERMARK_FOR_GUESTS:        false,
          SHOW_BRAND_WATERMARK:             false,
          DEFAULT_REMOTE_DISPLAY_NAME:      'Participant',
          TOOLBAR_BUTTONS:                  isModerator ? MODERATOR_BUTTONS : PARTICIPANT_BUTTONS,
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: false,
          HIDE_DEEP_LINKING_LOGO:           true,
          MOBILE_APP_PROMO:                 false,
        },
      })

      apiRef.current.addListener('videoConferenceJoined', () => {
        if (isModerator) {
          try { apiRef.current.executeCommand('toggleLobby', false) } catch {}
        }
      })

      apiRef.current.addListener('videoConferenceLeft', () => { onMeetingEnd?.() })
      apiRef.current.addListener('readyToClose',         () => { onMeetingEnd?.() })
      apiRef.current.addListener('errorOccurred',        (e: any) => { console.error('Jitsi error:', e) })

    } catch (err: any) {
      console.error('Jitsi init error:', err)
    }
  }, [roomName, userName, userEmail, isModerator, onMeetingEnd])

  useEffect(() => {
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
    script.onerror = () => console.error('Could not load Jitsi external_api.js')
    document.head.appendChild(script)

    return () => {
      if (apiRef.current) {
        try { apiRef.current.dispose() } catch {}
        apiRef.current = null
      }
    }
  }, [initJitsi])

  // The containerRef div fills the parent. Jitsi injects its own <iframe> into it.
  // No custom loading overlay — Jitsi shows its own connecting UI immediately.
  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', background: '#111' }} />
  )
}
