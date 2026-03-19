'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ExternalLink, Download, ArrowLeft, File, AlertTriangle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'

/**
 * Determines how to render a file:
 *
 * - Images         → <img> directly (works fine from Supabase)
 * - Video          → <video> HTML5 player
 * - Text/Code      → fetch + <pre>
 * - PDF, DOC/DOCX, PPT/PPTX, XLS/XLSX, and ANY other type
 *                  → Google Docs Viewer proxy (https://docs.google.com/viewer?url=…)
 *                    Supabase returns X-Frame-Options:DENY which blocks direct iframe embeds.
 *                    Google Docs Viewer fetches the file server-side and renders it safely.
 */

const IMAGE_EXTS  = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico', 'tiff']
const VIDEO_EXTS  = ['mp4', 'webm', 'ogg', 'mov', 'mkv', 'avi']
const TEXT_EXTS   = ['txt', 'md', 'csv', 'json', 'xml', 'html', 'css', 'js', 'ts', 'py', 'java', 'c', 'cpp']
const PDF_EXTS    = ['pdf']

function getExt(url: string) {
  return (url.split('?')[0].split('.').pop() || '').toLowerCase()
}

/** Auto-detect file category */
function getCategory(ext: string) {
  if (IMAGE_EXTS.includes(ext)) return 'image'
  if (VIDEO_EXTS.includes(ext)) return 'video'
  if (TEXT_EXTS.includes(ext))  return 'text'
  if (PDF_EXTS.includes(ext))   return 'pdf'
  return 'office' // DOCX, PPTX, XLSX etc → Microsoft Office Viewer
}

/** Convert plain-text URLs in a string to <a> tags */
function linkify(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const parts    = text.split(urlRegex)
  return parts.map((part, i) =>
    urlRegex.test(part)
      ? <a key={i} href={part} target="_blank" rel="noopener noreferrer"
          style={{ color: 'var(--accent-blue)', textDecoration: 'underline', wordBreak: 'break-all' }}>{part}</a>
      : part
  )
}

export default function MaterialViewerPage() {
  const params    = useSearchParams()
  const router    = useRouter()
  const fileUrl   = params.get('url')         || ''
  const title     = params.get('title')       || 'Material'
  const desc      = params.get('description') || ''

  const ext      = fileUrl ? getExt(fileUrl) : ''
  const category = ext ? getCategory(ext) : 'office'

  const [textContent, setTextContent] = useState<string | null>(null)
  const [textLoading, setTextLoading] = useState(false)
  const [iframeKey, setIframeKey]     = useState(0)   // force refresh iframe

  // PDF uses our own proxy with inline=true so the browser renders it natively
  const inlinePdfUrl = fileUrl 
    ? `/api/download?url=${encodeURIComponent(fileUrl)}&filename=document.pdf&inline=true` 
    : ''

  // Office Viewer URL — works best for PPTX, DOCX, XLSX
  // Needs a publicly accessible URL, so we pass the raw Supabase public URL.
  // We double encode the URL as required by MS viewer.
  const officeUrl = fileUrl
    ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`
    : ''

  useEffect(() => {
    if (category === 'text' && fileUrl) {
      setTextLoading(true)
      fetch(fileUrl)
        .then(r => r.text())
        .then(t => { setTextContent(t); setTextLoading(false) })
        .catch(() => { setTextContent('Could not load file content.'); setTextLoading(false) })
    }
  }, [fileUrl, category])

  if (!fileUrl) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <AlertTriangle size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
        <p style={{ color: 'var(--text-muted)' }}>No file URL provided.</p>
        <Button variant="secondary" leftIcon={<ArrowLeft size={15} />} style={{ marginTop: 16 }}
          onClick={() => router.back()}>Back</Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="page-header flex items-center justify-between">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button variant="secondary" size="sm" leftIcon={<ArrowLeft size={14} />}
            onClick={() => router.back()}>Back</Button>
          <div>
            <h1 style={{ fontSize: '1.125rem' }}>{title}</h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{ext} file</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href={fileUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="secondary" size="sm" leftIcon={<ExternalLink size={13} />}>Open in Tab</Button>
          </a>
          <a href={`/api/download?url=${encodeURIComponent(fileUrl)}&filename=${encodeURIComponent(title + '.' + ext)}`}>
            <Button variant="gradient" size="sm" leftIcon={<Download size={13} />}>Download</Button>
          </a>
        </div>
      </div>

      {/* Description */}
      {desc && (
        <div style={{ padding: '12px 16px', background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: 10, fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
          {linkify(desc)}
        </div>
      )}

      {/* Viewer */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', minHeight: 600 }}>

        {/* Image */}
        {category === 'image' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, minHeight: 500 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={fileUrl} alt={title}
              style={{ maxWidth: '100%', maxHeight: 640, borderRadius: 10, objectFit: 'contain' }} />
          </div>
        )}

        {/* Video */}
        {category === 'video' && (
          <div style={{ padding: 24 }}>
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video controls style={{ width: '100%', borderRadius: 10, maxHeight: 580 }}>
              <source src={fileUrl} type={`video/${ext}`} />
            </video>
          </div>
        )}

        {/* Plain Text / Code */}
        {category === 'text' && (
          textLoading
            ? <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
                <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent-blue)' }} />
              </div>
            : <pre style={{ padding: 24, overflow: 'auto', fontSize: '0.8125rem', fontFamily: 'monospace', lineHeight: 1.6, whiteSpace: 'pre-wrap', color: 'var(--text-primary)', maxHeight: 640 }}>
                {textContent}
              </pre>
        )}

        {/* Native PDF Viewer via Inline Proxy */}
        {category === 'pdf' && (
          <iframe
            key={iframeKey}
            src={inlinePdfUrl}
            style={{ width: '100%', height: 640, border: 'none' }}
            title={title}
            allow="fullscreen"
          />
        )}

        {/* Office / Other — Microsoft Office Viewer */}
        {category === 'office' && (
          <div style={{ position: 'relative' }}>
            {/* Info bar */}
            <div style={{ padding: '10px 16px', background: 'rgba(79,142,247,0.07)', borderBottom: '1px solid var(--border)', fontSize: '0.8125rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>📄 Rendered via Microsoft Office Viewer</span>
              <button onClick={() => setIframeKey(k => k + 1)}
                style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', cursor: 'pointer', fontSize: '0.8125rem' }}>
                ↺ Reload
              </button>
            </div>
            <iframe
              key={iframeKey}
              src={officeUrl}
              style={{ width: '100%', height: 640, border: 'none' }}
              title={title}
              allow="fullscreen"
            />
          </div>
        )}
      </div>
    </div>
  )
}
