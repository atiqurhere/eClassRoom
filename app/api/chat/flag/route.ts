import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// PII detection patterns
const PII_PATTERNS: { label: string; regex: RegExp }[] = [
  { label: 'phone number',   regex: /(\+?880|0)?1[3-9]\d{8}/g },           // BD mobile
  { label: 'phone number',   regex: /\+?\d[\d\s\-().]{8,14}\d/g },         // International
  { label: 'URL/link',       regex: /https?:\/\/\S+|www\.\S+/gi },
  { label: 'email address',  regex: /[\w.+-]+@[\w-]+\.[\w.]+/g },
  { label: 'card number',    regex: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g },
  { label: 'bank account',   regex: /\bIBAN\s*:?\s*[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7,}/gi },
  { label: 'bKash/Nagad',    regex: /\bbkash\b|\bnagad\b|\brocket\b/gi },
]

function detectPII(content: string): { flagged: boolean; reasons: string[] } {
  const found = new Set<string>()
  for (const { label, regex } of PII_PATTERNS) {
    regex.lastIndex = 0
    if (regex.test(content)) found.add(label)
  }
  return { flagged: found.size > 0, reasons: Array.from(found) }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { messageId, content, senderId, senderName } = await request.json()
    if (!messageId || !content) return NextResponse.json({ flagged: false })

    const { flagged, reasons } = detectPII(content)
    if (!flagged) return NextResponse.json({ flagged: false })

    const flagReason = reasons.join(', ')

    // Use service role to update the message (bypasses RLS)
    const { createClient: createAdmin } = await import('@supabase/supabase-js')
    const adminClient = createAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Flag the message
    await adminClient
      .from('messages')
      .update({ is_flagged: true, flag_reason: flagReason })
      .eq('id', messageId)

    // Get all admin user IDs for in-app notification
    const { data: admins } = await adminClient
      .from('users')
      .select('id, email')
      .eq('role', 'admin')

    if (admins?.length) {
      // Create in-app notifications for all admins
      await adminClient.from('notifications').insert(
        admins.map(a => ({
          user_id: a.id,
          title: '🚨 Flagged Message Detected',
          message: `${senderName || 'A user'} shared possibly sensitive info (${flagReason}) in a chat message. Review in Chat Monitor.`,
          type: 'chat_flag',
          link: '/admin/chat-monitor',
        }))
      )

      // Send email via Resend
      const resendKey = process.env.RESEND_API_KEY
      if (resendKey) {
        const adminEmails = admins.map(a => a.email).filter(Boolean)
        try {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: process.env.RESEND_FROM_EMAIL || 'noreply@lms.com',
              to: adminEmails,
              subject: '🚨 Flagged Chat Message — Review Required',
              html: `
                <h2>Flagged Message Alert</h2>
                <p><strong>Sender:</strong> ${senderName || senderId}</p>
                <p><strong>Detected:</strong> ${flagReason}</p>
                <p><strong>Message preview:</strong> ${content.substring(0, 200)}${content.length > 200 ? '…' : ''}</p>
                <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/chat-monitor" style="background:#ef4444;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;">View in Chat Monitor</a></p>
              `,
            }),
          })
        } catch (emailErr) {
          console.error('Resend email failed:', emailErr)
        }
      }
    }

    return NextResponse.json({ flagged: true, reasons })
  } catch (e: any) {
    console.error('Flag API error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
