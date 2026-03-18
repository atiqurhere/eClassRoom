/**
 * Environment validation — imported at server startup.
 * Throws a clear error if any required env var is missing
 * so deployment failures are obvious immediately.
 */

const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
] as const

type RequiredEnv = (typeof required)[number]

function validateEnv(): Record<RequiredEnv, string> {
  const missing: string[] = []

  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key)
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `\n\n❌ Missing required environment variables:\n${missing.map(k => `  - ${k}`).join('\n')}\n\nCreate a .env.local file with these variables. See .env.example for reference.\n`
    )
  }

  return required.reduce((acc, key) => {
    acc[key] = process.env[key]!
    return acc
  }, {} as Record<RequiredEnv, string>)
}

// Only validate on server side (not during client-side bundle evaluation)
export const env = typeof window === 'undefined' ? validateEnv() : ({} as Record<RequiredEnv, string>)
