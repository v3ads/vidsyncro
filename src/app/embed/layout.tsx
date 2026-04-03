export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          height: 100% !important;
          overflow: hidden !important;
          background: #000 !important;
          -webkit-tap-highlight-color: transparent;
          touch-action: none;
        }
      `}</style>
      {children}
    </>
  )
}
