import { useEffect, useRef, useState } from 'react'
import { startCamera, stopCamera } from './camera'

/** Owns the camera stream from mount to unmount (including React Strict Mode). */
export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    let stream: MediaStream | null = null
    const video = videoRef.current

    async function initialize() {
      try {
        const nextStream = await startCamera()
        if (cancelled) {
          stopCamera(nextStream)
          return
        }
        stream = nextStream
        if (video) {
          video.srcObject = nextStream
          try {
            await video.play()
          } catch {
            // Some browsers defer playback until they consider the element visible.
          }
        }
        if (!cancelled) setLoading(false)
      } catch (cause) {
        if (cancelled) return
        setError(cause instanceof Error ? cause.message : 'Camera unavailable.')
        setLoading(false)
      }
    }

    void initialize()
    return () => {
      cancelled = true
      if (video) video.srcObject = null
      if (stream) stopCamera(stream)
    }
  }, [attempt])

  function retry() {
    setError(null)
    setLoading(true)
    setAttempt((value) => value + 1)
  }

  return { videoRef, error, loading, retry }
}
