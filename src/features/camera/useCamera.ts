
import { useEffect, useRef, useState } from 'react'
import { startCamera, stopCamera } from './camera'

/** Owns the webcam stream and releases it on retry or unmount. */
export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    let stream: MediaStream | null = null
    const video = videoRef.current

    function releaseStream() {
      if (stream) {
        for (const track of stream.getVideoTracks()) {
          track.removeEventListener('ended', handleTrackEnded)
        }

        stopCamera(stream)
        stream = null
      }

      if (video) video.srcObject = null
    }

    function handleTrackEnded() {
      if (cancelled) return

      releaseStream()
      setError('The camera disconnected. Check your webcam and try again.')
      setLoading(false)
    }

    async function initialize() {
      try {
        const nextStream = await startCamera()

        if (cancelled) {
          stopCamera(nextStream)
          return
        }

        stream = nextStream

        for (const track of stream.getVideoTracks()) {
          track.addEventListener('ended', handleTrackEnded)
        }

        if (!video) {
          throw new Error('Camera preview is unavailable. Please retry.')
        }

        video.srcObject = stream

        try {
          await video.play()
        } catch (cause) {
          throw new Error(
            'The camera preview could not start. Press Retry to try again.',
            { cause },
          )
        }

        if (!cancelled) setLoading(false)
      } catch (cause) {
        if (cancelled) return

        releaseStream()
        setError(cause instanceof Error ? cause.message : 'Camera unavailable.')
        setLoading(false)
      }
    }

    void initialize()

    return () => {
      cancelled = true
      releaseStream()
    }
  }, [attempt])

  function retry() {
    setError(null)
    setLoading(true)
    setAttempt((value) => value + 1)
  }

  return { videoRef, error, loading, retry }
}
