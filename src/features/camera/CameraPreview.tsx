
import type { RefObject } from 'react'

type CameraPreviewProps = {
  videoRef: RefObject<HTMLVideoElement | null>
  loading: boolean
  error: string | null
  onRetry: () => void
  onReady: () => void
  countdown: number | 'flash' | null
}

export function CameraPreview({
  videoRef,
  loading,
  error,
  onRetry,
  onReady,
  countdown,
}: CameraPreviewProps) {
  return (
    <div className="camera-window">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        onPlaying={onReady}
        className="camera-video"
        aria-label="Camera preview"
      />

      {loading && !error && (
        <div className="camera-overlay" role="status">
          <span className="spinner" />
          <span>Starting camera...</span>
        </div>
      )}

      {error && (
        <div className="camera-overlay camera-error" role="alert">
          <p>{error}</p>

          <button
            type="button"
            className="button button-light"
            onClick={onRetry}
          >
            Retry
          </button>
        </div>
      )}

      {countdown !== null && (
        <div
          className="countdown-overlay"
          aria-live="assertive"
          aria-atomic="true"
        >
          {countdown === 'flash' ? (
            <div className="flash-screen" />
          ) : (
            <span
              key={countdown}
              className="countdown-number"
            >
              {countdown}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
