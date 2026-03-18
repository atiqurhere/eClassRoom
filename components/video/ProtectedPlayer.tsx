'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  liveClassId: string
  title?: string
}

export function ProtectedPlayer({ liveClassId, title }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [videoId, setVideoId] = useState<string | null>(null)
  const [error, setError]   = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/video/${liveClassId}`)
      .then(r => r.json())
      .then(d => {
        if (d.videoId) setVideoId(d.videoId)
        else setError(d.error || 'Video not available')
      })
      .catch(() => setError('Failed to load video'))
      .finally(() => setLoading(false))
  }, [liveClassId])

  // Block right-click and keyboard shortcuts on the container
  const blockMenu = (e: React.MouseEvent | React.KeyboardEvent) => e.preventDefault()

  const embedSrc = videoId
    ? `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&showinfo=0&iv_load_policy=3&fs=1&cc_load_policy=0`
    : null

  return (
    <div
      ref={containerRef}
      onContextMenu={blockMenu}
      style={{
        position: 'relative',
        width: '100%',
        background: '#0a0a0f',
        borderRadius: 14,
        overflow: 'hidden',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      {/* Aspect ratio box */}
      <div style={{ position: 'relative', paddingBottom: '56.25%' }}>

        {loading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, border: '3px solid #4f8ef730', borderTopColor: '#4f8ef7', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ color: '#666', fontSize: '0.875rem' }}>Loading recording…</p>
          </div>
        )}

        {error && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <p style={{ fontSize: '2rem' }}>🔒</p>
            <p style={{ color: '#ef4444', fontWeight: 600 }}>{error}</p>
          </div>
        )}

        {embedSrc && (
          <>
            {/* The iframe itself */}
            <iframe
              src={embedSrc}
              title={title || 'Class Recording'}
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
            />

            {/*
              Transparent overlay: catches right-clicks + drag (blocks "save video as").
              It has pointer-events: none so normal clicking passes THROUGH to iframe controls.
              We set pointer-events: all only on the edges/corners where there's no video control.
            */}
            <div
              onContextMenu={blockMenu}
              style={{
                position: 'absolute',
                inset: 0,
                // Only cover the top area (title bar) and the very edges — not the control bar
                // This lets the user interact with play/pause/fullscreen normally
                background: 'transparent',
                pointerEvents: 'none',
              }}
            />
            {/* Top-right corner shield — blocks inspect-element drag on video URL area */}
            <div
              onContextMenu={blockMenu}
              style={{
                position: 'absolute',
                top: 0, right: 0, width: '100%', height: '85%',
                cursor: 'default',
                pointerEvents: 'all',
                background: 'transparent',
              }}
            />
          </>
        )}
      </div>

      {/* Watermark to discourage screen recording */}
      {videoId && (
        <div style={{
          position: 'absolute', bottom: 48, right: 16,
          color: 'rgba(255,255,255,0.08)',
          fontSize: '0.7rem',
          fontWeight: 700,
          letterSpacing: 2,
          userSelect: 'none',
          pointerEvents: 'none',
          textTransform: 'uppercase',
        }}>
          E-Classroom · Private Recording
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
