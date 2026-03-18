import { ReactNode } from 'react'
import type { Viewport } from 'next'

export const viewport: Viewport = { themeColor: '#16a34a' }

export default function LandingLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
