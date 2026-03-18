'use client'

interface Props { embedUrl: string }

export function RecordingPlayer({ embedUrl }: Props) {
  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#000' }}>
      <iframe
        src={embedUrl}
        title="Class Recording"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
      />
    </div>
  )
}
