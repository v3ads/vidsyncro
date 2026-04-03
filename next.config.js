/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'image.mux.com',
      },
      {
        protocol: 'https',
        hostname: 'stream.mux.com',
      },
    ],
  },

  async headers() {
    return [
      {
        source: '/embed/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'ALLOWALL' },
          { key: 'Content-Security-Policy', value: "frame-ancestors *;" },
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
    ]
  },

  async rewrites() {
    const embedUrl = process.env.NEXT_PUBLIC_EMBED_URL || 'https://embed.vidsyncro.com'
    const embedHostname = new URL(embedUrl).hostname

    return {
      beforeFiles: [
        // embed.vidsyncro.com → /embed/[id]
        {
          source: '/:path*',
          has: [{ type: 'host', value: embedHostname }],
          destination: '/embed/:path*',
        },
        // vidframe.io root → /vidframe landing (exact match, must come before wildcard)
        {
          source: '/',
          has: [{ type: 'host', value: 'vidframe.io' }],
          destination: '/vidframe',
        },
        {
          source: '/',
          has: [{ type: 'host', value: 'www.vidframe.io' }],
          destination: '/vidframe',
        },
        // *.vidframe.io subdomains → embed player (wildcard, must come AFTER exact matches)
        {
          source: '/:path*',
          has: [{ type: 'host', value: '(?<subdomain>[^.]+)\\.vidframe\\.io' }],
          destination: '/embed/:path*',
        },
      ],
    }
  },
}

module.exports = nextConfig
