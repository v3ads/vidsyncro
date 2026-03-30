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
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'VidSyncro — Two Realities. One Hold.',
    template: '%s | VidSyncro',
  },
  description:
    'The enterprise dual-video platform. Show two synchronized video realities with a single hold. Perfect for before/after, A/B comparisons, and interactive storytelling.',
  keywords: [
    'dual video',
    'video comparison',
    'interactive video',
    'before after video',
    'video embed',
    'enterprise video',
  ],
  authors: [{ name: 'VidSyncro' }],
  creator: 'VidSyncro',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://vidsyncro.com',
    siteName: 'VidSyncro',
    title: 'VidSyncro — Two Realities. One Hold.',
    description:
      'The enterprise dual-video platform. Show two synchronized video realities with a single hold.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VidSyncro — Two Realities. One Hold.',
    description:
      'The enterprise dual-video platform. Show two synchronized video realities with a single hold.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="bg-[#0a0a0a] text-white antialiased font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
