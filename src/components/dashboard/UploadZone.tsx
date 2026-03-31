import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface UploadZoneProps {
  label?: string
  uploadedId?: string
  projectId?: string
  videoSlot?: 'a' | 'b'
  onComplete?: (uploadId: string) => void
  onUploadComplete?: (assetId: string, playbackId: string) => void
  onUploadError?: (error: string) => void
}

export function UploadZone({ label, uploadedId, projectId, videoSlot, onComplete, onUploadComplete, onUploadError }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<string>("")

  const handleUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith("video/")) {
      onUploadError?.("Please select a video file")
      return
    }
    if (!projectId || !videoSlot) {
      onUploadError?.("Project not ready — please try again")
      return
    }
    setIsUploading(true)
    setStatus("Getting upload URL...")
    setProgress(5)
    try {
      const res = await fetch("/api/videos/mux-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, videoSlot }),
      })
      if (!res.ok) throw new Error("Failed to get upload URL")
      const { uploadUrl, uploadId } = await res.json()
      const assetId = uploadId
      setStatus("Uploading video...")
      setProgress(20)
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(20 + Math.round((e.loaded / e.total) * 70))
        }
        xhr.onload = () => (xhr.status === 200 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`)))
        xhr.onerror = () => reject(new Error("Upload failed"))
        xhr.open("PUT", uploadUrl)
        xhr.send(file)
      })
      setStatus("Processing...")
      setProgress(95)
      // Notify with uploadId (for new project wizard) or poll for playbackId
      if (onComplete) {
        onComplete(uploadId || assetId)
        setProgress(100)
        setStatus("Ready!")
        return
      }
      let attempts = 0
      while (attempts < 30) {
        await new Promise((r) => setTimeout(r, 3000))
        const statusRes = await fetch(`/api/videos/mux-upload?assetId=${assetId}`)
        if (statusRes.ok) {
          const data = await statusRes.json()
          if (data.status === "ready" && data.playbackId) {
            setProgress(100)
            setStatus("Ready!")
            onUploadComplete?.(assetId, data.playbackId)
            return
          }
        }
        attempts++
      }
      throw new Error("Processing timeout")
    } catch (err: any) {
      onUploadError?.(err.message)
      setStatus("")
    } finally {
      setIsUploading(false)
      setProgress(0)
    }
  }, [onComplete, onUploadComplete, onUploadError])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleUpload(file)
  }, [handleUpload])

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300 ${
        isDragging ? "border-purple-400 bg-purple-500/10" : uploadedId ? "border-green-500/40 bg-green-500/5" : "border-white/20 hover:border-white/40"
      }`}
    >
      {label && <div className="text-xs text-white/40 uppercase tracking-widest mb-4">{label}</div>}
      <AnimatePresence mode="wait">
        {uploadedId && !isUploading ? (
          <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="text-4xl mb-2">✅</div>
            <p className="text-green-400 text-sm">Video uploaded</p>
            <p className="text-white/30 text-xs mt-1 font-mono truncate">{uploadedId}</p>
          </motion.div>
        ) : isUploading ? (
          <motion.div key="uploading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="text-white/70 mb-4">{status}</div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <motion.div className="bg-purple-500 h-2 rounded-full" animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
            </div>
            <div className="text-white/40 text-sm mt-2">{progress}%</div>
          </motion.div>
        ) : (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="text-4xl mb-3">🎬</div>
            <p className="text-white/70 mb-1">Drag & drop your video here</p>
            <p className="text-white/40 text-sm mb-5">MP4, MOV, WebM — up to 5GB</p>
            <label className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-colors text-sm">
              Choose File
              <input type="file" accept="video/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} />
            </label>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
