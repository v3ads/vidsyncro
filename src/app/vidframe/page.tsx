export const metadata = {
  title: 'VidFrame — Two Realities. One Hold.',
  description: 'The enterprise dual-video platform. Drop two synchronized videos into one embed. Hold to reveal. Release to return.',
}

export default function VidFrameLanding() {
  return (
    <main style={{
      minHeight: '100vh',
      width: '100%',
      background: '#0a0a0a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      color: 'white',
      margin: 0,
      padding: 0,
    }}>
      {/* Background glow */}
      <div style={{
        position: 'fixed',
        top: '30%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 700,
        height: 700,
        background: 'radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      <div style={{
        position: 'relative',
        zIndex: 1,
        textAlign: 'center',
        padding: '2rem',
        maxWidth: 640,
      }}>
        {/* Badge */}
        <div style={{
          display: 'inline-block',
          background: 'rgba(139,92,246,0.12)',
          border: '1px solid rgba(139,92,246,0.3)',
          color: '#c4b5fd',
          fontSize: '0.72rem',
          fontWeight: 600,
          letterSpacing: '0.1em',
          textTransform: 'uppercase' as const,
          padding: '0.35rem 0.9rem',
          borderRadius: 9999,
          marginBottom: '2rem',
        }}>
          Private Platform
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: 'clamp(2.8rem, 8vw, 4.5rem)',
          fontWeight: 900,
          lineHeight: 1.05,
          letterSpacing: '-0.03em',
          marginBottom: '1.25rem',
          margin: '0 0 1.25rem 0',
        }}>
          Two Realities.{' '}
          <span style={{
            background: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            One Hold.
          </span>
        </h1>

        {/* Subheadline */}
        <p style={{
          fontSize: '1.125rem',
          color: '#a1a1aa',
          lineHeight: 1.7,
          maxWidth: 460,
          margin: '0 auto',
        }}>
          The enterprise dual-video platform. Drop two synchronized videos into
          one embed. Hold to reveal. Release to return.
        </p>
      </div>
    </main>
  )
}
