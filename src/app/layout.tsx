import type { Metadata } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  weight: ['500', '600', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'VidSyncro — Two Realities. One Hold.',
    template: '%s | VidSyncro',
  },
  description:
    'The enterprise dual-video platform. Drop two synchronized videos into one embed. Hold to reveal. Release to return. The future of interactive media.',
  keywords: ['dual video', 'interactive video', 'before after video', 'video embed', 'enterprise video'],
  authors: [{ name: 'VidSyncro' }],
  creator: 'VidSyncro',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://vidsyncro.com',
    siteName: 'VidSyncro',
    title: 'VidSyncro — Two Realities. One Hold.',
    description: 'The enterprise dual-video platform.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VidSyncro — Two Realities. One Hold.',
    description: 'The enterprise dual-video platform.',
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${spaceGrotesk.variable}`}
      data-theme="dark"
      style={{ colorScheme: 'dark' }}
    >
      <head>
        <meta name="theme-color" content="#0a0a0a" />
      </head>
      <body
        className="bg-[#0a0a0a] text-white antialiased"
        style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
