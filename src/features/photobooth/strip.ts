
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

// Use local time rather than UTC when naming downloaded files.
// Include milliseconds so repeated downloads get unique names.
function downloadFilename(date: Date = new Date()): string {
  const pad = (value: number, length = 2) =>
    String(value).padStart(length, '0')

  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  const hour = pad(date.getHours())
  const minute = pad(date.getMinutes())
  const second = pad(date.getSeconds())
  const millisecond = pad(date.getMilliseconds(), 3)

  return (
    `pictayo-${year}-${month}-${day}-` +
    `${hour}-${minute}-${second}-${millisecond}.png`
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
        reject(
          new Error('A captured photo is invalid. Please retake it.')
        )
        return
      }

      resolve(image)
    }

    image.onerror = () => {
      reject(
        new Error(
          'A captured photo could not be loaded. Please retake it.'
        )
      )
    }

    image.src = source
  })
}

function canvasBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(
          new Error(
            'Unable to prepare your PNG. Please try again.'
          )
        )
        return
      }

      resolve(blob)
    }, 'image/png')
  })
}

function drawCaption(
  ctx: CanvasRenderingContext2D,
  caption: string,
  theme: StripTheme,
): void {
  const maxWidth = 1050
  let fontSize = 68

  while (fontSize > 34) {
    ctx.font = `bold ${fontSize}px ${theme.font}`

    if (ctx.measureText(caption).width <= maxWidth) {
      break
    }

    fontSize -= 2
  }

  ctx.font = `bold ${fontSize}px ${theme.font}`
  ctx.fillText(
    caption,
    STRIP_WIDTH / 2,
    LAYOUT.captionY,
    maxWidth,
  )
}

// Shared footer renderer for the preview and PNG export.
export function drawStripFooter(
  ctx: CanvasRenderingContext2D,
  theme: StripTheme,
  caption: string,
  showDate: boolean,
  createdAt: Date,
): void {
  ctx.save()

  try {
    ctx.fillStyle = theme.ink
    ctx.textAlign = 'center'
    ctx.textBaseline = 'alphabetic'

    if (caption.trim()) {
      drawCaption(ctx, caption.trim(), theme)
    }

    if (showDate) {
      ctx.font = '30px Arial, sans-serif'
      ctx.fillText(
        dateLabel(createdAt).toUpperCase(),
        STRIP_WIDTH / 2,
        LAYOUT.dateY,
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
): Promise<Blob> {
  if (
    photos.length !== PHOTO_COUNT ||
    photos.some((photo) => !photo)
  ) {
    throw new Error('Take all four photos before downloading.')
  }

  const images = await Promise.all(
    photos.map((source) => {
      if (!source) {
        throw new Error('A captured photo is missing.')
      }

      return loadPhoto(source)
    }),
  )

  const canvas = document.createElement('canvas')
  canvas.width = STRIP_WIDTH
  canvas.height = STRIP_HEIGHT

  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error(
      'Canvas export is not available in this browser.'
    )
  }

  // Background only. No photo mats or borders.
  ctx.fillStyle = theme.background
  ctx.fillRect(0, 0, STRIP_WIDTH, STRIP_HEIGHT)

  for (let index = 0; index < PHOTO_COUNT; index++) {
    const y =
      LAYOUT.top +
      index * (LAYOUT.photoHeight + LAYOUT.gap)

    drawCover(
      ctx,
      images[index],
      LAYOUT.left,
      y,
      LAYOUT.width,
      LAYOUT.photoHeight,
    )
  }

  drawStripFooter(
    ctx,
    theme,
    caption,
    showDate,
    createdAt,
  )

  return canvasBlob(canvas)
}

export async function downloadStrip(
  photos: PhotoSlots,
  theme: StripTheme,
  caption: string,
  showDate: boolean,
  createdAt: Date,
): Promise<void> {
  const blob = await renderStrip(
    photos,
    theme,
    caption,
    showDate,
    createdAt,
  )

  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  let requested = false

  try {
    anchor.href = url
    anchor.download = downloadFilename()

    document.body.appendChild(anchor)
    anchor.click()

    // This means the download was requested.
    // It does not guarantee the browser saved the file.
    requested = true
  } finally {
    anchor.remove()

    if (requested) {
      // Give the browser time to access the Blob URL.
      window.setTimeout(() => {
        URL.revokeObjectURL(url)
      }, 30_000)
    } else {
      // If an error occurred before the request,
      // release the temporary URL immediately.
      URL.revokeObjectURL(url)
    }
  }
}
