/**
 * Dedicated layout for /live-room — completely strips the dashboard sidebar,
 * nav, and global padding so the Zoom redirect/launcher renders full-screen.
 *
 * This overrides the root layout's children wrapper for this route segment only.
 * We must still pass through the root layout's <html>/<body> (Next.js requirement)
 * so we cannot redefine those — instead we just render children directly.
 */
export default function LiveRoomLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      overflow: 'hidden',
      background: '#0f1117',
    }}>
      {children}
    </div>
  )
}
