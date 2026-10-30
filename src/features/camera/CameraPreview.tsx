import { useCamera } from './useCamera'

export function CameraPreview() {
  const { videoRef, error, loading } = useCamera()

  return (
    <div className="space-y-4">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="aspect-video w-full rounded-xl bg-black object-cover"
      />

      {loading && <p>Starting camera...</p>}

      {error && (
        <p role="alert" className="text-red-500">
          {error}
        </p>
      )}
    </div>
  )
}