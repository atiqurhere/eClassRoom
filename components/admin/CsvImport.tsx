'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'

interface CsvRow { full_name: string; email: string; role: string; student_id?: string; password?: string }

interface Props { onDone?: () => void }

export function CsvImport({ onDone }: Props) {
  const fileRef   = useRef<HTMLInputElement>(null)
  const [rows, setRows]       = useState<CsvRow[]>([])
  const [importing, setImporting] = useState(false)
  const [results, setResults] = useState<{ ok: number; fail: string[] } | null>(null)

  const parseCsv = (text: string): CsvRow[] => {
    const lines = text.trim().split(/\r?\n/)
    const header = lines[0].split(',').map(h => h.trim().toLowerCase())
    return lines.slice(1).map(line => {
      const vals = line.split(',').map(v => v.trim())
      const row: any = {}
      header.forEach((h, i) => { row[h] = vals[i] || '' })
      return row as CsvRow
    }).filter(r => r.full_name && r.email)
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = evt => {
      const text = evt.target?.result as string
      setRows(parseCsv(text))
      setResults(null)
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    if (!rows.length) return
    setImporting(true)
    let ok = 0
    const fail: string[] = []

    await Promise.all(rows.map(async row => {
      try {
        const res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            full_name: row.full_name,
            email: row.email,
            role: row.role || 'student',
            password: row.password || 'TempPass@123',
            student_id: row.student_id || undefined,
          }),
        })
        if (res.ok) ok++
        else {
          const json = await res.json()
          fail.push(`${row.email}: ${json.error || 'failed'}`)
        }
      } catch {
        fail.push(`${row.email}: network error`)
      }
    }))

    setImporting(false)
    setResults({ ok, fail })
    if (ok > 0) toast.success(`Imported ${ok} users`)
    if (fail.length) toast.error(`${fail.length} failed`)
    if (ok > 0 && onDone) onDone()
  }

  const card = 'var(--bg-card)'
  const bdr  = '1px solid var(--border)'

  return (
    <div style={{ background: card, border: bdr, borderRadius: 14, padding: 20 }}>
      <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>📥 Bulk CSV Import</p>
      <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 12 }}>
        CSV columns: <code>full_name, email, role (admin/teacher/student), student_id (optional), password (optional, default: TempPass@123)</code>
      </p>
      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <button onClick={() => fileRef.current?.click()}
          style={{ padding: '8px 14px', background: 'var(--bg-hover)', border: bdr, borderRadius: 8, color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
          📎 {rows.length ? `${rows.length} rows loaded` : 'Choose CSV file'}
        </button>
        <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleFile} />
        {rows.length > 0 && (
          <button onClick={handleImport} disabled={importing}
            style={{ padding: '8px 16px', background: importing ? '#666' : 'linear-gradient(135deg,#4f8ef7,#8b5cf6)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: importing ? 'not-allowed' : 'pointer' }}>
            {importing ? `Importing…` : `Import ${rows.length} users`}
          </button>
        )}
      </div>

      {rows.length > 0 && !results && (
        <div style={{ maxHeight: 200, overflowY: 'auto', background: 'var(--bg-hover)', borderRadius: 8, padding: 12 }}>
          {rows.slice(0, 5).map((r, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
              <span style={{ minWidth: 120 }}>{r.full_name}</span>
              <span style={{ flex: 1, color: 'var(--text-muted)' }}>{r.email}</span>
              <span style={{ padding: '1px 8px', borderRadius: 100, background: r.role === 'teacher' ? '#4f8ef718' : '#22c55e18', color: r.role === 'teacher' ? '#4f8ef7' : '#22c55e', fontSize: '0.7rem', fontWeight: 700 }}>{r.role}</span>
            </div>
          ))}
          {rows.length > 5 && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>+ {rows.length - 5} more rows</p>}
        </div>
      )}

      {results && (
        <div style={{ padding: '12px 14px', background: results.fail.length ? '#ef444410' : '#22c55e10', borderRadius: 8, border: `1px solid ${results.fail.length ? '#ef444430' : '#22c55e30'}` }}>
          <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>✅ {results.ok} imported{results.fail.length ? ` · ❌ ${results.fail.length} failed` : ''}</p>
          {results.fail.slice(0, 5).map((f, i) => <p key={i} style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: 4 }}>{f}</p>)}
        </div>
      )}
    </div>
  )
}
