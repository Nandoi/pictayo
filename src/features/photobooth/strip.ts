
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

export type PhotoLayoutId = '4-cut' | '3-cut' | '2x2'

export type PhotoRect = {
  x: number
  y: number
  width: number
  height: number
}

export type PhotoLayout = {
  id: PhotoLayoutId
  name: string
  count: number
  width: number
  height: number
  slots: PhotoRect[]
  captionY: number
  dateY: number
}

const FOUR_CUT_SLOTS: PhotoRect[] = Array.from(
  { length: 4 },
  (_, index) => ({
    x: 56,
    y: 72 + index * (658 + 14),
    width: 1088,
    height: 658,
  }),
)

const THREE_CUT_SLOTS: PhotoRect[] = FOUR_CUT_SLOTS.slice(0, 3)

export const PHOTO_LAYOUTS: PhotoLayout[] = [
  {
    id: '4-cut',
    name: '4-cut',
    count: 4,
    width: STRIP_WIDTH,
    height: STRIP_HEIGHT,
    slots: FOUR_CUT_SLOTS,
    captionY: 2930,
    dateY: 3080,
  },
  {
    id: '3-cut',
    name: '3-cut',
    count: 3,
    width: STRIP_WIDTH,
    height: 2400,
    slots: THREE_CUT_SLOTS,
    captionY: 2200,
    dateY: 2320,
  },
  {
    id: '2x2',
    name: '2×2',
    count: 4,
    width: STRIP_WIDTH,
    height: 1080,
    slots: [
      { x: 56, y: 72, width: 537, height: 325 },
      { x: 607, y: 72, width: 537, height: 325 },
      { x: 56, y: 411, width: 537, height: 325 },
      { x: 607, y: 411, width: 537, height: 325 },
    ],
    captionY: 880,
    dateY: 1020,
  },
]

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

export function dateLabel(date: Date = new Date()): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function downloadFilename(date: Date = new Date()): string {
  const pad = (value: number, length = 2) =>
    String(value).padStart(length, '0')

  return (
    `pictayo-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-` +
    `${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}-` +
    `${pad(date.getMilliseconds(), 3)}.png`
  )
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  if (image.naturalWidth <= 0 || image.naturalHeight <= 0) {
    throw new Error('A captured photo is invalid. Please retake it.')
  }

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

    image.onload = () => {
      if (image.naturalWidth <= 0 || image.naturalHeight <= 0) {
        reject(new Error('A captured photo is invalid. Please retake it.'))
        return
      }

      resolve(image)
    }

    image.onerror = () => {
      reject(
        new Error('A captured photo could not be loaded. Please retake it.'),
      )
    }

    image.src = source
  })
}

function canvasBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
      } else {
        reject(new Error('Unable to prepare your PNG. Please try again.'))
      }
    }, 'image/png')
  })
}

function drawCaption(
  ctx: CanvasRenderingContext2D,
  caption: string,
  theme: StripTheme,
  layout: PhotoLayout,
): void {
  const maxWidth = layout.width - 150
  let fontSize = 68

  while (fontSize > 34) {
    ctx.font = `bold ${fontSize}px ${theme.font}`
    if (ctx.measureText(caption).width <= maxWidth) break
    fontSize -= 2
  }

  ctx.font = `bold ${fontSize}px ${theme.font}`
  ctx.fillText(
    caption,
    layout.width / 2,
    layout.captionY,
    maxWidth,
  )
}

/** Use the same footer painter for the preview and downloaded PNG. */
export function drawStripFooter(
  ctx: CanvasRenderingContext2D,
  theme: StripTheme,
  caption: string,
  showDate: boolean,
  createdAt: Date,
  layout: PhotoLayout = PHOTO_LAYOUTS[0],
): void {
  ctx.save()

  try {
    ctx.fillStyle = theme.ink
    ctx.textAlign = 'center'
    ctx.textBaseline = 'alphabetic'

    if (caption.trim()) {
      drawCaption(ctx, caption.trim(), theme, layout)
    }

    if (showDate) {
      ctx.font = '30px Arial, sans-serif'
      ctx.fillText(
        dateLabel(createdAt).toUpperCase(),
        layout.width / 2,
        layout.dateY,
      )
    }
  } finally {
    ctx.restore()
  }
}

export async function renderStrip(
  photos: PhotoSlots,
  theme: StripTheme,
  caption: string,
  showDate: boolean,
  createdAt: Date,
  layout: PhotoLayout = PHOTO_LAYOUTS[0],
): Promise<Blob> {
  if (
    photos.length !== layout.count ||
    photos.some((photo) => !photo)
  ) {
    throw new Error(
      `Take all ${layout.count} photos before downloading.`,
    )
  }

  const images = await Promise.all(
    photos.map((source) => {
      if (!source) throw new Error('A captured photo is missing.')
      return loadPhoto(source)
    }),
  )

  const canvas = document.createElement('canvas')
  canvas.width = layout.width
  canvas.height = layout.height

  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Canvas export is not available in this browser.')
  }

  ctx.fillStyle = theme.background
  ctx.fillRect(0, 0, layout.width, layout.height)

  layout.slots.forEach((slot, index) => {
    drawCover(
      ctx,
      images[index],
      slot.x,
      slot.y,
      slot.width,
      slot.height,
    )
  })

  drawStripFooter(ctx, theme, caption, showDate, createdAt, layout)
  return canvasBlob(canvas)
}

export async function downloadStrip(
  photos: PhotoSlots,
  theme: StripTheme,
  caption: string,
  showDate: boolean,
  createdAt: Date,
  layout: PhotoLayout = PHOTO_LAYOUTS[0],
): Promise<void> {
  const blob = await renderStrip(
    photos,
    theme,
    caption,
    showDate,
    createdAt,
    layout,
  )

  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  let requested = false

  try {
    anchor.href = url
    anchor.download = downloadFilename()

    document.body.appendChild(anchor)
    anchor.click()

    requested = true
  } finally {
    anchor.remove()

    if (requested) {
      window.setTimeout(() => URL.revokeObjectURL(url), 30_000)
    } else {
      URL.revokeObjectURL(url)
    }
  }
}
