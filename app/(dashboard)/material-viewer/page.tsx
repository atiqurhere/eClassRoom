'use client'

import { useEffect, useState } from 'react'
import { useSearchParams }     from 'next/navigation'
import { ExternalLink, FileText, Download, ArrowLeft, File, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

/**
 * In-app material viewer — renders PDFs in an iframe and links for other file types.
 * Opened via /student/classes?viewMaterial=<file_url>&title=<title>
 */
export default function MaterialViewerPage() {
  const params  = useSearchParams()
  const fileUrl = params.get('url')  || ''
  const title   = params.get('title') || 'Material'
  const [ext, setExt] = useState('')

  useEffect(() => {
    if (fileUrl) {
      const parts = fileUrl.split('?')[0].split('.')
      setExt(parts[parts.length - 1].toLowerCase())
    }
  }, [fileUrl])

  if (!fileUrl) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <AlertTriangle size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
        <p style={{ color: 'var(--text-muted)' }}>No file URL provided.</p>
        <Link href="/student/classes"><Button variant="secondary" leftIcon={<ArrowLeft size={15} />} style={{ marginTop: 16 }}>Back</Button></Link>
      </div>
    )
  }

  const isPdf     = ext === 'pdf'
  const isImage   = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)
  const isVideo   = ['mp4', 'webm', 'ogg', 'mkv'].includes(ext)
  const isViewable = isPdf || isImage || isVideo

  return (
    <div className="space-y-4">
      <div className="page-header flex items-center justify-between">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="javascript:history.back()">
            <Button variant="secondary" size="sm" leftIcon={<ArrowLeft size={14} />}>Back</Button>
          </Link>
          <div>
            <h1 style={{ fontSize: '1.125rem' }}>{title}</h1>
            <p style={{ fontSize: '0.8125rem' }}>{ext.toUpperCase()} file</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href={fileUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="secondary" size="sm" leftIcon={<ExternalLink size={13} />}>Open in Tab</Button>
          </a>
          <a href={fileUrl} download>
            <Button variant="gradient" size="sm" leftIcon={<Download size={13} />}>Download</Button>
          </a>
        </div>
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', minHeight: 600 }}>
        {isPdf && (
          <iframe
            src={fileUrl}
            style={{ width: '100%', height: 700, border: 'none', borderRadius: 14 }}
            title={title}
          />
        )}
        {isImage && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <img src={fileUrl} alt={title} style={{ maxWidth: '100%', maxHeight: 600, borderRadius: 10, objectFit: 'contain' }} />
          </div>
        )}
        {isVideo && (
          <div style={{ padding: 24 }}>
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video controls style={{ width: '100%', borderRadius: 10, maxHeight: 560 }}>
              <source src={fileUrl} type={`video/${ext}`} />
              Your browser does not support video playback.
            </video>
          </div>
        )}
        {!isViewable && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <File size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
            <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
              Preview not available for {ext.toUpperCase()} files
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 20 }}>
              Download the file to view it with the appropriate application.
            </p>
            <a href={fileUrl} download>
              <Button variant="gradient" leftIcon={<Download size={15} />}>Download {ext.toUpperCase()}</Button>
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
