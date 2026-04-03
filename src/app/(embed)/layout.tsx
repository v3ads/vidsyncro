export default function EmbedRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#000000" />
        <style>{`
          *, *::before, *::after { box-sizing: border-box; }
          html, body {
            margin: 0; padding: 0;
            width: 100%; height: 100%;
            overflow: hidden;
            background: #000;
            -webkit-tap-highlight-color: transparent;
            touch-action: none;
          }
        `}</style>
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}
