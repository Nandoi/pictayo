export async function startCamera(): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('Camera not supported.')
  }

  return navigator.mediaDevices.getUserMedia({
    video: true,
    audio: false,
  })
}

export function stopCamera(stream: MediaStream): void {
  stream.getTracks().forEach((track) => track.stop())
}