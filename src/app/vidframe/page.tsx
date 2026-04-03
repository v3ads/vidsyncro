export const metadata = {
  title: 'VidFrame — Two Realities. One Hold.',
  description: 'The enterprise dual-video platform. Drop two synchronized videos into one embed. Hold to reveal. Release to return.',
}

export default function VidFrameLanding() {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          html, body {
            width: 100%;
            height: 100%;
            background: #0a0a0a;
            color: white;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
          }
          .container {
            text-align: center;
            padding: 2rem;
            max-width: 640px;
          }
          .badge {
            display: inline-block;
            background: rgba(139,92,246,0.12);
            border: 1px solid rgba(139,92,246,0.3);
            color: #c4b5fd;
            font-size: 0.75rem;
            font-weight: 600;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            padding: 0.35rem 0.9rem;
            border-radius: 9999px;
            margin-bottom: 2rem;
          }
          h1 {
            font-size: clamp(2.5rem, 8vw, 4.5rem);
            font-weight: 900;
            line-height: 1.05;
            letter-spacing: -0.03em;
            margin-bottom: 1.25rem;
          }
          .gradient {
            background: linear-gradient(135deg, #a78bfa, #7c3aed);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          p {
            font-size: 1.125rem;
            color: #a1a1aa;
            line-height: 1.7;
            max-width: 480px;
            margin: 0 auto;
          }
          .glow {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -60%);
            width: 600px;
            height: 600px;
            background: radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%);
            pointer-events: none;
            z-index: 0;
          }
          .container { position: relative; z-index: 1; }
        `}</style>
      </head>
      <body>
        <div className="glow" />
        <div className="container">
          <div className="badge">Private Platform</div>
          <h1>
            Two Realities.<br />
            <span className="gradient">One Hold.</span>
          </h1>
          <p>
            The enterprise dual-video platform. Drop two synchronized videos into
            one embed. Hold to reveal. Release to return.
          </p>
        </div>
      </body>
    </html>
  )
}
