import { useEffect, useRef, useState } from 'react'
import { startCamera, stopCamera } from './camera'

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    let stream: MediaStream | null = null
    const video = videoRef.current

    async function initializeCamera() {
      try {
        const cameraStream = await startCamera()

        if (!active) {
          stopCamera(cameraStream)
          return
        }

        stream = cameraStream

        if (video) {
          video.srcObject = stream
        }

        setLoading(false)
      } catch (err) {
        if (!active) return

        setError(
          err instanceof Error ? err.message : 'Unable to access camera.'
        )
        setLoading(false)
      }
    }

    void initializeCamera()

    return () => {
      active = false

      if (video) video.srcObject = null
      if (stream) stopCamera(stream)
    }
  }, [])

  return { videoRef, error, loading }
}