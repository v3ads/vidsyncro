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

  // Handle *.vidframe.io → /embed/[id]
  // Any subdomain of vidframe.io is a client-branded embed domain
  if (hostname.endsWith('.vidframe.io') && hostname !== 'www.vidframe.io') {
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
