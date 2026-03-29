import { redirect } from 'next/navigation'

export default function Home() {
  // This will be handled by middleware to redirect to appropriate dashboard
  redirect('/login')
}
