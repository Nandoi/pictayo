import './strip-layout.css'

export const STRIP_WIDTH = 1200
export const STRIP_HEIGHT = 3200
export const PHOTO_COUNT = 4

export type PhotoSlots = (string | null)[]

export type StripTheme = {
  id: 'white' | 'black' | 'oat' | 'stone' | 'rose' | 'sage'
  name: string
  detail: string
  background: string
  ink: string
  font: string
}

/** Six minimal background-only photo strip templates. */
export const THEMES: StripTheme[] = [
  {
    id: 'white',
    name: 'White',
    detail: 'Crisp and classic',
    background: '#FFFFFF',
    ink: '#202020',
    font: 'Arial, sans-serif',
  },
  {
    id: 'black',
    name: 'Black',
    detail: 'Clean contrast',
    background: '#151515',
    ink: '#FFFFFF',
    font: 'Arial, sans-serif',
  },
  {
    id: 'oat',
    name: 'Oat',
    detail: 'Warm off-white',
    background: '#F1EADC',
    ink: '#473F35',
    font: 'Georgia, serif',
  },
  {
    id: 'stone',
    name: 'Stone',
    detail: 'Cool soft gray',
    background: '#DADCDD',
    ink: '#303235',
    font: 'Arial, sans-serif',
  },
  {
    id: 'rose',
    name: 'Rose',
    detail: 'Muted blush',
    background: '#EAD8DA',
    ink: '#513F45',
    font: 'Georgia, serif',
  },
  {
    id: 'sage',
    name: 'Sage',
    detail: 'Soft green',
    background: '#D7DFD3',
    ink: '#334038',
    font: 'Arial, sans-serif',
  },
]

/**
 * One shared export geometry (in pixels, 1200 x 3200).
 * Matching CSS percentages in strip-layout.css give the same live preview.
 */
const LAYOUT = {
  left: 56,
  top: 72,
  width: 1088,
  photoHeight: 658,
  gap: 14,
  captionY: 2930,
  dateY: 3080,
} as const

export function dateLabel(date: Date = new Date()): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) {
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
    image.onerror = () =>
      reject(new Error('One of your photos could not be loaded.'))
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

function drawCaption(
  ctx: CanvasRenderingContext2D,
  caption: string,
  theme: StripTheme,
) {
  const maxWidth = 1050
  let fontSize = 68

  while (fontSize > 34) {
    ctx.font = `bold ${fontSize}px ${theme.font}`
    if (ctx.measureText(caption).width <= maxWidth) break
    fontSize -= 2
  }

  ctx.font = `bold ${fontSize}px ${theme.font}`
  ctx.fillText(caption, STRIP_WIDTH / 2, LAYOUT.captionY, maxWidth)
}

export async function renderStrip(
  photos: PhotoSlots,
  theme: StripTheme,
  caption: string,
  showDate: boolean,
  createdAt: Date,
): Promise<Blob> {
  if (photos.length !== PHOTO_COUNT || photos.some((photo) => !photo)) {
    throw new Error('Take all four photos before downloading.')
  }

  const images = await Promise.all(photos.map((source) => loadPhoto(source!)))
  const canvas = document.createElement('canvas')
  canvas.width = STRIP_WIDTH
  canvas.height = STRIP_HEIGHT

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Canvas export is not available in this browser.')
  }

  // Only the strip background is colored. Photos have no mat or border.
  ctx.fillStyle = theme.background
  ctx.fillRect(0, 0, STRIP_WIDTH, STRIP_HEIGHT)

  for (let index = 0; index < PHOTO_COUNT; index++) {
    const y = LAYOUT.top + index * (LAYOUT.photoHeight + LAYOUT.gap)
    drawCover(
      ctx,
      images[index],
      LAYOUT.left,
      y,
      LAYOUT.width,
      LAYOUT.photoHeight,
    )
  }

  // The footer is intentionally spacious and blank by default.
  ctx.fillStyle = theme.ink
  ctx.textAlign = 'center'

  if (caption.trim()) drawCaption(ctx, caption.trim(), theme)

  if (showDate) {
    ctx.font = '30px Arial, sans-serif'
    ctx.fillText(dateLabel(createdAt).toUpperCase(), STRIP_WIDTH / 2, LAYOUT.dateY)
  }

  return canvasBlob(canvas)
}

export async function downloadStrip(
  photos: PhotoSlots,
  theme: StripTheme,
  caption: string,
  showDate: boolean,
  createdAt: Date,
): Promise<void> {
  const blob = await renderStrip(photos, theme, caption, showDate, createdAt)
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `pictayo-${new Date().toISOString().slice(0, 10)}.png`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000)
}
