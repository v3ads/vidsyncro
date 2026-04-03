import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const { pathname, hostname } = request.nextUrl

  // Handle embed.vidsyncro.com → /embed/[id]
  const embedHostname = process.env.NEXT_PUBLIC_EMBED_URL
    ? new URL(process.env.NEXT_PUBLIC_EMBED_URL).hostname
    : 'embed.vidsyncro.com'

  if (hostname === embedHostname) {
    const url = request.nextUrl.clone()
    url.pathname = `/embed${pathname}`
    return NextResponse.rewrite(url)
  }

  // Handle vidframe.io root and www → serve landing HTML directly from middleware
  if ((hostname === 'vidframe.io' || hostname === 'www.vidframe.io') && pathname === '/') {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>VidFrame — Two Realities. One Hold.</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 100%; height: 100%; min-height: 100vh;
      background: #0a0a0a; color: #fff;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      display: flex; align-items: center; justify-content: center;
    }
    .glow {
      position: fixed; top: 30%; left: 50%;
      transform: translate(-50%, -50%);
      width: 700px; height: 700px;
      background: radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%);
      pointer-events: none;
    }
    .wrap { position: relative; z-index: 1; text-align: center; padding: 2rem; max-width: 640px; }
    .badge {
      display: inline-block;
      background: rgba(139,92,246,0.12); border: 1px solid rgba(139,92,246,0.3);
      color: #c4b5fd; font-size: 0.72rem; font-weight: 600;
      letter-spacing: 0.1em; text-transform: uppercase;
      padding: 0.35rem 0.9rem; border-radius: 9999px; margin-bottom: 2rem;
    }
    h1 { font-size: clamp(2.8rem, 8vw, 4.5rem); font-weight: 900; line-height: 1.05; letter-spacing: -0.03em; margin-bottom: 1.25rem; }
    .g { background: linear-gradient(135deg, #a78bfa, #7c3aed); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    p { font-size: 1.125rem; color: #a1a1aa; line-height: 1.7; max-width: 460px; margin: 0 auto; }
  </style>
</head>
<body>
  <div class="glow"></div>
  <div class="wrap">
    <div class="badge">Private Platform</div>
    <h1>Two Realities.<br><span class="g">One Hold.</span></h1>
    <p>The enterprise dual-video platform. Drop two synchronized videos into one embed. Hold to reveal. Release to return.</p>
  </div>
</body>
</html>`
    return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  }

  // Handle *.vidframe.io → /embed/[id]
  // Any subdomain of vidframe.io is a client-branded embed domain
  if (hostname.endsWith('.vidframe.io')) {
    const url = request.nextUrl.clone()
    url.pathname = `/embed${pathname}`
    return NextResponse.rewrite(url)
  }

  // Allow /embed/* to be public
  if (pathname.startsWith('/embed/')) {
    return NextResponse.next()
  }

  // Pass through /api/* without auth checks
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Protect /dashboard/*
  if (pathname.startsWith('/dashboard')) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })

    if (!token) {
      const signInUrl = new URL('/auth/signin', request.url)
      signInUrl.searchParams.set('callbackUrl', request.url)
      return NextResponse.redirect(signInUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/embed/:path*',
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
