
/** Browser camera operations. No React dependencies. */

// Must match the per-photo area in photobooth/strip.ts.
export const CAPTURE_WIDTH = 1088
export const CAPTURE_HEIGHT = 658

export async function startCamera(): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error(
      'Camera access requires a supported browser on HTTPS or localhost.'
    )
  }

  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: 'user',
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    })
  } catch (error) {
    if (error instanceof DOMException) {
      if (
        error.name === 'NotAllowedError' ||
        error.name === 'PermissionDeniedError'
      ) {
        throw new Error(
          'Camera permission was blocked. Allow access in your browser settings and try again.',
          { cause: error }
        )
      }

      if (
        error.name === 'NotFoundError' ||
        error.name === 'DevicesNotFoundError'
      ) {
        throw new Error(
          'No camera was found. Connect a webcam and try again.',
          { cause: error }
        )
      }

      if (
        error.name === 'NotReadableError' ||
        error.name === 'TrackStartError'
      ) {
        throw new Error(
          'Your camera is in use by another app. Close it and try again.',
          { cause: error }
        )
      }
    }

    throw new Error(
      'Could not start your camera. Check its connection and try again.',
      { cause: error }
    )
  }
}

export function stopCamera(stream: MediaStream): void {
  for (const track of stream.getTracks()) {
    track.stop()
  }
}

/**
 * Capture the same composition shown by the camera viewfinder.
 *
 * Different cameras may return 16:9, 4:3, or portrait video.
 * We center-crop that video to the strip photo ratio before saving.
 */
export function capturePhoto(video: HTMLVideoElement): string {
  if (
    video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
    !video.videoWidth ||
    !video.videoHeight
  ) {
    throw new Error('Camera is not ready. Please wait a moment.')
  }

  const sourceWidth = video.videoWidth
  const sourceHeight = video.videoHeight
  const targetRatio = CAPTURE_WIDTH / CAPTURE_HEIGHT

  let cropWidth = sourceWidth
  let cropHeight = sourceHeight
  let cropX = 0
  let cropY = 0

  if (sourceWidth / sourceHeight > targetRatio) {
    // Wide camera: crop the left and right edges.
    cropWidth = sourceHeight * targetRatio
    cropX = (sourceWidth - cropWidth) / 2
  } else {
    // Tall camera: crop the top and bottom edges.
    cropHeight = sourceWidth / targetRatio
    cropY = (sourceHeight - cropHeight) / 2
  }

  const canvas = document.createElement('canvas')
  canvas.width = CAPTURE_WIDTH
  canvas.height = CAPTURE_HEIGHT

  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Your browser could not capture the photo.')
  }

  // Mirror the image to match the live selfie preview.
  context.translate(CAPTURE_WIDTH, 0)
  context.scale(-1, 1)

  context.drawImage(
    video,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    0,
    0,
    CAPTURE_WIDTH,
    CAPTURE_HEIGHT,
  )

  return canvas.toDataURL('image/jpeg', 0.92)
}
