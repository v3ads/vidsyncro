export default function VidFrameLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: #0a0a0a !important;
          overflow-x: hidden;
        }
      `}</style>
      {children}
    </>
  )
}
