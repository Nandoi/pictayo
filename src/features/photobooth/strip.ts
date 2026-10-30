/** Strip layout is fixed at 1200 × 3200 pixels. Display and export share this design. */
export const STRIP_WIDTH = 1200
export const STRIP_HEIGHT = 3200
export const PHOTO_COUNT = 4

export type PhotoSlots = (string | null)[]

export type StripTheme = {
  id: 'peach' | 'paper' | 'night'
  name: string
  detail: string
  background: string
  ink: string
  accent: string
  frame: string
  photoMat: string
  font: string
}

export const THEMES: StripTheme[] = [
  { id: 'peach', name: 'Peachy', detail: 'Warm & sweet', background: '#f8dad1', ink: '#493a34', accent: '#d76c5c', frame: '#fffaf2', photoMat: '#eab6ab', font: 'Georgia, serif' },
  { id: 'paper', name: 'Paper', detail: 'Minimal & timeless', background: '#f5f0e7', ink: '#2d302b', accent: '#677c67', frame: '#ffffff', photoMat: '#d9d1c4', font: 'Arial, sans-serif' },
  { id: 'night', name: 'After Dark', detail: 'A little dramatic', background: '#29252c', ink: '#fff2df', accent: '#e99b9c', frame: '#f7ebdf', photoMat: '#53444f', font: 'Georgia, serif' },
]

export function dateLabel(date: Date = new Date()): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function drawCover(ctx: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, width: number, height: number) {
  const imageAspect = image.naturalWidth / image.naturalHeight
  const targetAspect = width / height
  let sx = 0
  let sy = 0
  let sw = image.naturalWidth
  let sh = image.naturalHeight

  if (imageAspect > targetAspect) {
    sw = image.naturalHeight * targetAspect
    sx = (image.naturalWidth - sw) / 2
  } else {
    sh = image.naturalWidth / targetAspect
    sy = (image.naturalHeight - sh) / 2
  }
  ctx.drawImage(image, sx, sy, sw, sh, x, y, width, height)
}

function loadPhoto(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('One of your photos could not be loaded.'))
    image.src = source
  })
}

function canvasBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Unable to create PNG. Please try again.'))
    }, 'image/png')
  })
}

function fillTextFitted(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, baseSize: number, fontFamily: string) {
  let size = baseSize
  while (size > 34) {
    ctx.font = `bold ${size}px ${fontFamily}`
    if (ctx.measureText(text).width <= maxWidth) break
    size -= 2
  }
  ctx.fillText(text, STRIP_WIDTH / 2, 2910, maxWidth)
}

export async function renderStrip(photos: PhotoSlots, theme: StripTheme, caption: string, showDate: boolean, createdAt: Date): Promise<Blob> {
  if (photos.length !== PHOTO_COUNT || photos.some((photo) => !photo)) {
    throw new Error('Take all four photos before downloading.')
  }

  const images = await Promise.all(photos.map((source) => loadPhoto(source!)))
  const canvas = document.createElement('canvas')
  canvas.width = STRIP_WIDTH
  canvas.height = STRIP_HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas export is not available in this browser.')

  ctx.fillStyle = theme.background
  ctx.fillRect(0, 0, STRIP_WIDTH, STRIP_HEIGHT)

  // Header typography and decorative dots.
  ctx.fillStyle = theme.ink
  ctx.textAlign = 'center'
  ctx.font = 'bold 80px Arial, sans-serif'
  ctx.fillText('pictayo.', STRIP_WIDTH / 2, 130)
  ctx.font = '24px Arial, sans-serif'
  ctx.fillText('FOUR LITTLE MOMENTS · ONE FOREVER MEMORY', STRIP_WIDTH / 2, 185)
  ctx.fillStyle = theme.accent
  for (let i = 0; i < 4; i++) ctx.fillRect(516 + i * 42, 212, 24, 8)

  // One consistent 4-photo layout for all themes.
  const x = 100
  const top = 270
  const photoWidth = 1000
  const photoHeight = 590
  const gap = 30
  for (let index = 0; index < PHOTO_COUNT; index++) {
    const y = top + index * (photoHeight + gap)
    ctx.fillStyle = theme.photoMat
    ctx.fillRect(x - 15, y - 15, photoWidth + 30, photoHeight + 30)
    ctx.fillStyle = theme.frame
    ctx.fillRect(x - 8, y - 8, photoWidth + 16, photoHeight + 16)
    drawCover(ctx, images[index], x, y, photoWidth, photoHeight)
  }

  ctx.fillStyle = theme.accent
  ctx.fillRect(474, 2823, 252, 5)
  ctx.textAlign = 'center'
  ctx.fillStyle = theme.ink
  fillTextFitted(ctx, caption.trim() || 'our little moments', 1020, 68, theme.font)
  ctx.font = '26px Arial, sans-serif'
  ctx.fillText('KEEP THIS MOMENT CLOSE', STRIP_WIDTH / 2, 2975)
  if (showDate) {
    ctx.font = '30px Arial, sans-serif'
    ctx.fillText(dateLabel(createdAt).toUpperCase(), STRIP_WIDTH / 2, 3050)
  }
  ctx.font = '22px Arial, sans-serif'
  ctx.fillText('MADE WITH ♡ ON PICTAYO', STRIP_WIDTH / 2, 3148)

  return canvasBlob(canvas)
}

export async function downloadStrip(photos: PhotoSlots, theme: StripTheme, caption: string, showDate: boolean, createdAt: Date) {
  const blob = await renderStrip(photos, theme, caption, showDate, createdAt)
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `pictayo-${new Date().toISOString().slice(0, 10)}.png`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  // Delay revocation to allow browsers (including Safari) to start the download.
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000)
}
