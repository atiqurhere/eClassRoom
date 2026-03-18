'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'

declare global {
  interface Window {
    JitsiMeetExternalAPI: any
  }
}

interface JitsiMeetingProps {
  roomName: string
  userName: string
  userEmail: string
  isModerator?: boolean
  onMeetingEnd?: () => void
}

export function JitsiMeeting({
  roomName,
  userName,
  userEmail,
  isModerator = false,
  onMeetingEnd,
}: JitsiMeetingProps) {
  const jitsiContainer = useRef<HTMLDivElement>(null)
  const jitsiAPI = useRef<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Load Jitsi script
    const script = document.createElement('script')
    script.src = 'https://meet.jit.si/external_api.js'
    script.async = true
    script.onload = () => initJitsi()
    script.onerror = () => setError('Failed to load Jitsi. Please refresh the page.')
    document.body.appendChild(script)

    return () => {
      if (jitsiAPI.current) {
        jitsiAPI.current.dispose()
      }
      const existingScript = document.querySelector('script[src="https://meet.jit.si/external_api.js"]')
      if (existingScript) {
        document.body.removeChild(existingScript)
      }
    }
  }, [roomName])

  const initJitsi = () => {
    if (!jitsiContainer.current) return

    try {
      const domain = process.env.NEXT_PUBLIC_JITSI_DOMAIN || 'meet.jit.si'

      const options = {
        roomName: roomName,
        width: '100%',
        height: '100%',
        parentNode: jitsiContainer.current,
        userInfo: {
          displayName: userName,
          email: userEmail,
        },
        configOverwrite: {
          startWithAudioMuted: true,
          startWithVideoMuted: false,
          disableModeratorIndicator: false,
          enableWelcomePage: false,
          prejoinPageEnabled: false,
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          TOOLBAR_BUTTONS: [
            'microphone',
            'camera',
            'desktop',
            'fullscreen',
            'fodeviceselection',
            'hangup',
            'chat',
            'raisehand',
            'videoquality',
            'tileview',
            'download',
            'help',
            ...(isModerator ? ['recording'] : []),
          ],
          DEFAULT_REMOTE_DISPLAY_NAME: 'Participant',
        },
      }

      jitsiAPI.current = new window.JitsiMeetExternalAPI(domain, options)

      // Event listeners
      jitsiAPI.current.addListener('videoConferenceJoined', () => {
        setLoading(false)
      })

      jitsiAPI.current.addListener('videoConferenceLeft', () => {
        if (onMeetingEnd) onMeetingEnd()
      })

      jitsiAPI.current.addListener('readyToClose', () => {
        if (onMeetingEnd) onMeetingEnd()
      })

      // Set moderator status (teachers)
      if (isModerator) {
        // Moderator features enabled via Jitsi config
      }
    } catch (err) {
      console.error('Error initializing Jitsi:', err)
      setError('Failed to initialize video call. Please try again.')
      setLoading(false)
    }
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg z-10">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary-600 mx-auto mb-4" />
            <p className="text-gray-600">Connecting to live class...</p>
          </div>
        </div>
      )}
      <div ref={jitsiContainer} className="w-full h-full rounded-lg overflow-hidden" />
    </div>
  )
}
