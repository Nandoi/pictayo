
/** Browser camera operations. No React dependencies. */

// Match the aspect ratio of each photo in the final strip.
export const CAPTURE_WIDTH = 1088
export const CAPTURE_HEIGHT = 658

// Preserve detail without storing excessively large photos.
const MAX_CAPTURE_WIDTH = 1920
const JPEG_QUALITY = 0.95

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

        // Ideal values, not strict requirements.
        // Lower-resolution webcams can still connect.
        width: { ideal: 1920 },
        height: { ideal: 1080 },
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
 * Capture the same centered composition shown by the viewfinder.
 *
 * Preserve native cropped resolution whenever possible.
 * A low-resolution camera should not be artificially upscaled.
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

  // Center-crop the camera image to the photo-strip ratio.
  if (sourceWidth / sourceHeight > targetRatio) {
    // Wide camera: remove excess left/right areas.
    cropWidth = sourceHeight * targetRatio
    cropX = (sourceWidth - cropWidth) / 2
  } else {
    // Tall camera: remove excess top/bottom areas.
    cropHeight = sourceWidth / targetRatio
    cropY = (sourceHeight - cropHeight) / 2
  }

  // Keep native cropped dimensions when possible.
  // Only downscale if the photo exceeds our width limit.
  const scale = Math.min(
    1,
    MAX_CAPTURE_WIDTH / cropWidth
  )

  const outputWidth = Math.max(
    1,
    Math.floor(cropWidth * scale)
  )

  const outputHeight = Math.max(
    1,
    Math.floor(cropHeight * scale)
  )

  const canvas = document.createElement('canvas')

  canvas.width = outputWidth
  canvas.height = outputHeight

  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Your browser could not capture the photo.')
  }

  // High-quality image scaling when downsampling is necessary.
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'

  // Preserve the mirrored selfie appearance.
  context.translate(outputWidth, 0)
  context.scale(-1, 1)

  context.drawImage(
    video,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    0,
    0,
    outputWidth,
    outputHeight,
  )

  return canvas.toDataURL('image/jpeg', JPEG_QUALITY)
}
