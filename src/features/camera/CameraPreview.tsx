import type { RefObject } from 'react'

type CameraPreviewProps = {
  videoRef: RefObject<HTMLVideoElement | null>
  loading: boolean
  error: string | null
  onRetry: () => void
  onReady: () => void
  countdown: number | 'flash' | null
}

export function CameraPreview({ videoRef, loading, error, onRetry, onReady, countdown }: CameraPreviewProps) {
  return (
    <div className="camera-window">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        onPlaying={onReady}
        className="camera-video"
        aria-label="Live camera preview"
      />

      <div className="camera-window-top" aria-hidden="true">
        <span className="live-indicator"><span /> LIVE PREVIEW</span>
        <span>16:9</span>
      </div>
      <div className="camera-guide" aria-hidden="true" />
      {loading && !error && (
        <div className="camera-overlay" role="status">
          <span className="spinner" />
          <span>Warming up your camera…</span>
        </div>
      )}
      {error && (
        <div className="camera-overlay camera-error" role="alert">
          <span className="camera-error-icon">!</span>
          <strong>We can’t see you yet</strong>
          <p>{error}</p>
          <button className="button button-light" type="button" onClick={onRetry}>Try again</button>
        </div>
      )}
      {countdown !== null && (
        <div className="countdown-overlay" aria-live="assertive" aria-atomic="true">
          {countdown === 'flash' ? <div className="flash-screen" /> : <span key={countdown} className="countdown-number">{countdown}</span>}
        </div>
      )}
      <div className="camera-window-bottom" aria-hidden="true">SMILE, YOU’RE ON PICTAYO</div>
    </div>
  )
}
