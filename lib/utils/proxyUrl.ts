/**
 * Returns a proxied download URL that routes through /api/download.
 * This hides the raw Supabase URL from the browser and ensures files
 * stored in private buckets are still accessible (service-role key is used).
 *
 * @param fileUrl   The raw Supabase storage URL
 * @param filename  Optional display filename (defaults to last URL segment)
 * @param inline    If true, serves inline (browser preview) instead of attachment download
 */
export function proxyFileUrl(fileUrl: string, filename?: string, inline?: boolean): string {
  if (!fileUrl) return '#'
  const name = filename || fileUrl.split('/').pop() || 'file'
  const params = new URLSearchParams({ url: fileUrl, filename: name })
  if (inline) params.set('inline', 'true')
  return `/api/download?${params.toString()}`
}
