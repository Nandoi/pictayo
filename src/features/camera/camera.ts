/** Browser camera operations. No React dependencies. */
export async function startCamera(): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('Camera access requires a supported browser on HTTPS or localhost.')
  }

  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
    })
  } catch (error) {
    if (error instanceof DOMException) {
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        throw new Error('Camera permission was blocked. Allow access in your browser settings and try again.')
      }
      if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        throw new Error('No camera was found. Connect a webcam and try again.')
      }
      if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        throw new Error('Your camera is in use by another app. Close it and try again.')
      }
    }
    throw new Error('Could not start your camera. Check its connection and try again.')
  }
}

export function stopCamera(stream: MediaStream): void {
  for (const track of stream.getTracks()) track.stop()
}

/** Mirrors the saved picture, matching the mirrored on-screen selfie preview. */
export function capturePhoto(video: HTMLVideoElement): string {
  if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || !video.videoWidth || !video.videoHeight) {
    throw new Error('Camera is not ready. Please wait a moment.')
  }

  const canvas = document.createElement('canvas')
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Your browser could not capture the photo.')

  context.translate(canvas.width, 0)
  context.scale(-1, 1)
  context.drawImage(video, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.92)
}
