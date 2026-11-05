
import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { CameraPreview } from '../camera/CameraPreview'
import { capturePhoto } from '../camera/camera'
import { useCamera } from '../camera/useCamera'
import {
  drawStripFooter,
  downloadStrip,
  PHOTO_COUNT,
  PHOTO_LAYOUTS,
  THEMES,
} from './strip'
import type {
  PhotoLayout,
  PhotoLayoutId,
  PhotoRect,
  PhotoSlots,
  StripTheme,
} from './strip'
import './capture-feedback.css'
import './restart-confirmation.css'
import './download-feedback.css'
import './photo-layouts.css'

const COUNTDOWN_SECONDS = 3
const FLASH_DURATION = 750
const SAVED_FEEDBACK_DURATION = 1800

const sleep = (ms: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, ms))

type CameraSessionProps = {
  photos: PhotoSlots
  layout: PhotoLayout
  onLayoutChange: (id: PhotoLayoutId) => void
  retakeSlot: number | null
  onPhoto: (index: number, dataUrl: string) => void
  onDesign: () => void
  onCancelRetake: () => void
  onReset: () => void
}

function CameraSession({
  photos,
  layout,
  onLayoutChange,
  retakeSlot,
  onPhoto,
  onDesign,
  onCancelRetake,
  onReset,
}: CameraSessionProps) {
  const { videoRef, error, loading, retry } = useCamera()

  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [countdown, setCountdown] =
    useState<number | 'flash' | null>(null)
  const [currentShot, setCurrentShot] = useState<number | null>(null)
  const [captureError, setCaptureError] = useState<string | null>(null)
  const [selectedRetake, setSelectedRetake] =
    useState<number | null>(null)
  const [savedPhoto, setSavedPhoto] = useState<number | null>(null)
  const [freshPhoto, setFreshPhoto] = useState<number | null>(null)

  const runId = useRef(0)
  const feedbackTimer = useRef<number | null>(null)
  const capturing = useRef(false)

  const completed =
    photos.length === layout.count && photos.every(Boolean)
  const remaining = photos.filter((photo) => !photo).length
  const taken = layout.count - remaining
  const nextShot = photos.findIndex((photo) => photo === null)
  const selectedPhoto = retakeSlot ?? selectedRetake
  const activePhoto = selectedPhoto ?? nextShot

  useEffect(() => () => {
    runId.current += 1

    if (feedbackTimer.current !== null) {
      window.clearTimeout(feedbackTimer.current)
    }
  }, [])

  function clearFeedback() {
    if (feedbackTimer.current !== null) {
      window.clearTimeout(feedbackTimer.current)
      feedbackTimer.current = null
    }

    setSavedPhoto(null)
    setFreshPhoto(null)
  }

  function handleReset() {
    clearFeedback()
    setSelectedRetake(null)
    onReset()
  }

  function selectRetake(index: number) {
    if (
      capturing.current ||
      busy ||
      retakeSlot !== null ||
      !photos[index]
    ) return

    clearFeedback()
    setCaptureError(null)

    setSelectedRetake((previous) =>
      previous === index ? null : index
    )
  }

  function cancelRetake() {
    if (capturing.current || busy) return

    clearFeedback()
    setCaptureError(null)

    if (retakeSlot !== null) {
      onCancelRetake()
    } else {
      setSelectedRetake(null)
    }
  }

  async function takeShot(index: number, finishAfter = false) {
    if (
      capturing.current ||
      busy ||
      loading ||
      error ||
      !ready ||
      index < 0
    ) return

    const video = videoRef.current
    if (!video) return

    const id = ++runId.current
    capturing.current = true

    clearFeedback()
    setBusy(true)
    setCurrentShot(index)
    setCaptureError(null)

    try {
      for (
        let second = COUNTDOWN_SECONDS;
        second >= 1;
        second--
      ) {
        setCountdown(second)
        await sleep(1000)

        if (runId.current !== id) return
      }

      const image = capturePhoto(video)
      onPhoto(index, image)
      setFreshPhoto(index)

      setCountdown('flash')
      await sleep(FLASH_DURATION)

      if (runId.current !== id) return

      setCountdown(null)
      setSelectedRetake(null)

      if (finishAfter) {
        onDesign()
      } else {
        setSavedPhoto(index)

        feedbackTimer.current = window.setTimeout(() => {
          setSavedPhoto(null)
          setFreshPhoto(null)
          feedbackTimer.current = null
        }, SAVED_FEEDBACK_DURATION)
      }
    } catch (cause) {
      if (runId.current === id) {
        setCaptureError(
          cause instanceof Error
            ? cause.message
            : 'Could not capture photo.'
        )
      }
    } finally {
      if (runId.current === id) {
        setCountdown(null)
        setCurrentShot(null)
        capturing.current = false
        setBusy(false)
      }
    }
  }

  function handleCapture() {
    if (retakeSlot !== null) {
      void takeShot(retakeSlot, true)
    } else if (selectedRetake !== null) {
      void takeShot(selectedRetake)
    } else if (nextShot !== -1) {
      void takeShot(nextShot)
    }
  }

  return (
    <section className="booth-session" aria-label="Photobooth capture">
      <div className="booth-camera-frame">
        <CameraPreview
          videoRef={videoRef}
          loading={loading}
          error={error}
          onRetry={() => {
            setReady(false)
            retry()
          }}
          onReady={() => setReady(true)}
          countdown={countdown}
        />

        {savedPhoto !== null && (
          <div
            className="booth-saved-feedback"
            role="status"
            aria-live="polite"
          >
            <span
              className="booth-saved-check"
              aria-hidden="true"
            >
              ✓
            </span>
            Photo {savedPhoto + 1} saved
          </div>
        )}
      </div>

      <aside className="booth-controls" aria-label="Capture controls">
        <div className="booth-controls-top">
          <div className="booth-layout-label">Layout</div>

          <div
            className="booth-layout-options"
            role="group"
            aria-label="Photo layout"
          >
            {PHOTO_LAYOUTS.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`booth-layout-choice ${
                  layout.id === option.id
                    ? 'booth-layout-choice-active'
                    : ''
                }`}
                aria-pressed={layout.id === option.id}
                disabled={
                  taken > 0 ||
                  busy ||
                  retakeSlot !== null
                }
                onClick={() => onLayoutChange(option.id)}
              >
                {option.name}
              </button>
            ))}
          </div>

          <div className="booth-progress" aria-live="polite">
            {taken} of {layout.count} taken
          </div>

          <p className="booth-help" aria-live="polite">
            {selectedPhoto !== null
              ? `Photo ${selectedPhoto + 1} selected. Press Retake when you're ready.`
              : completed
                ? 'All photos taken. Choose a photo to retake, or continue.'
                : 'Take your time. The next photo starts only when you click.'}
          </p>
        </div>

        <div className="booth-controls-bottom">
          <button
            type="button"
            className="button button-primary booth-shutter"
            onClick={handleCapture}
            disabled={
              busy ||
              loading ||
              !ready ||
              Boolean(error) ||
              (completed && selectedPhoto === null)
            }
          >
            {busy
              ? `Capturing photo ${(currentShot ?? 0) + 1}...`
              : selectedPhoto !== null
                ? `Retake photo ${selectedPhoto + 1}`
                : completed
                  ? 'All photos taken'
                  : `Take photo ${activePhoto + 1}`}
          </button>

          {selectedPhoto !== null && (
            <button
              type="button"
              className="button button-outline booth-cancel-retake"
              onClick={cancelRetake}
              disabled={busy}
            >
              Cancel retake
            </button>
          )}

          {completed && selectedPhoto === null && (
            <button
              type="button"
              className="button button-dark booth-next-button"
              onClick={onDesign}
              disabled={busy}
            >
              Continue
            </button>
          )}

          {captureError && (
            <p className="inline-error" role="alert">
              {captureError}
            </p>
          )}

          <button
            type="button"
            className="text-button booth-reset"
            onClick={handleReset}
            disabled={busy}
          >
            Start over
          </button>
        </div>
      </aside>

      <div className="booth-gallery" aria-label="Captured photos">
        <div
          className="shots-row booth-shots-row"
          style={{
            gridTemplateColumns:
              `repeat(${layout.count}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: layout.count }, (_, index) => (
            <button
              key={index}
              type="button"
              className={`shot-thumb ${
                photos[index] ? 'shot-thumb-filled' : ''
              } ${
                currentShot === index
                  ? 'shot-thumb-active'
                  : ''
              } ${
                selectedPhoto === index
                  ? 'shot-thumb-selected'
                  : ''
              } ${
                freshPhoto === index
                  ? 'shot-thumb-new'
                  : ''
              }`}
              disabled={
                !photos[index] ||
                busy ||
                loading ||
                Boolean(error) ||
                !ready ||
                retakeSlot !== null
              }
              onClick={() => selectRetake(index)}
              aria-pressed={
                photos[index]
                  ? selectedPhoto === index
                  : undefined
              }
              aria-label={
                photos[index]
                  ? selectedPhoto === index
                    ? `Photo ${index + 1} selected for retake`
                    : `Select photo ${index + 1} to retake`
                  : `Photo ${index + 1} not taken`
              }
              title={
                photos[index]
                  ? selectedPhoto === index
                    ? `Photo ${index + 1} selected. Press Retake photo ${index + 1} to capture.`
                    : `Select photo ${index + 1} to retake`
                  : `Photo ${index + 1} not taken`
              }
            >
              {photos[index] ? (
                <img
                  src={photos[index]}
                  alt={`Photo ${index + 1}`}
                />
              ) : (
                <span className="shot-thumb-number">
                  0{index + 1}
                </span>
              )}

              {photos[index] && (
                <span
                  className="shot-retake-indicator"
                  aria-hidden="true"
                >
                  <span className="booth-retake-symbol">
                    ↻
                  </span>
                  <span className="booth-retake-text">
                    {selectedPhoto === index
                      ? 'Selected'
                      : 'Retake'}
                  </span>
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

function photoRectStyle(
  layout: PhotoLayout,
  rect: PhotoRect,
): CSSProperties {
  return {
    position: 'absolute',
    left: `${(rect.x / layout.width) * 100}%`,
    top: `${(rect.y / layout.height) * 100}%`,
    width: `${(rect.width / layout.width) * 100}%`,
    height: `${(rect.height / layout.height) * 100}%`,
  }
}

/**
 * Use identical photo positions for the preview and
 * background thumbnails. The PNG uses these same rectangles.
 */
function LayoutPhotos({
  photos,
  layout,
  mini = false,
}: {
  photos: PhotoSlots
  layout: PhotoLayout
  mini?: boolean
}) {
  return (
    <div
      className={
        mini
          ? 'layout-mini-slots'
          : 'layout-strip-slots'
      }
    >
      {layout.slots.map((rect, index) => (
        <div
          key={index}
          className={
            mini
              ? 'layout-mini-slot'
              : 'layout-strip-slot'
          }
          style={photoRectStyle(layout, rect)}
        >
          {photos[index] ? (
            <img
              src={photos[index]}
              alt={
                mini
                  ? ''
                  : `Strip photo ${index + 1}`
              }
            />
          ) : !mini ? (
            <span className="strip-empty">
              0{index + 1}
            </span>
          ) : null}
        </div>
      ))}
    </div>
  )
}

type StripPreviewProps = {
  photos: PhotoSlots
  layout: PhotoLayout
  theme: StripTheme
  caption: string
  showDate: boolean
  createdAt: Date
}

function StripPreview({
  photos,
  layout,
  theme,
  caption,
  showDate,
  createdAt,
}: StripPreviewProps) {
  const footerCanvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = footerCanvasRef.current
    const ctx = canvas?.getContext('2d')

    if (!ctx) return

    ctx.clearRect(
      0,
      0,
      layout.width,
      layout.height,
    )

    drawStripFooter(
      ctx,
      theme,
      caption,
      showDate,
      createdAt,
      layout,
    )
  }, [layout, theme, caption, showDate, createdAt])

  return (
    <div
      className="strip"
      style={{
        backgroundColor: theme.background,
        color: theme.ink,
        aspectRatio: `${layout.width} / ${layout.height}`,
      }}
      aria-label={`${layout.name} photo preview`}
    >
      <LayoutPhotos
        photos={photos}
        layout={layout}
      />

      <canvas
        ref={footerCanvasRef}
        className="strip-text-layer"
        width={layout.width}
        height={layout.height}
        aria-hidden="true"
      />
    </div>
  )
}

type ReviewProps = {
  photos: PhotoSlots
  onRetake: (slot: number) => void
  onReset: () => void
  saving: boolean
}

function PhotoReview({
  photos,
  onRetake,
  onReset,
  saving,
}: ReviewProps) {
  return (
    <section className="studio-card" aria-label="Photo review">
      <div className="review-grid">
        {photos.map((photo, index) => (
          <div className="review-photo" key={index}>
            {photo && (
              <img
                src={photo}
                alt={`Photo ${index + 1}`}
              />
            )}

            <span className="review-photo-index">
              0{index + 1}
            </span>

            <button
              type="button"
              onClick={() => onRetake(index)}
              disabled={saving}
            >
              Retake
            </button>
          </div>
        ))}
      </div>

      <div className="review-bottom">
        <button
          type="button"
          className="button button-outline"
          onClick={onReset}
          disabled={saving}
        >
          Start over
        </button>
      </div>
    </section>
  )
}

export function Photobooth() {
  const [photos, setPhotos] = useState<PhotoSlots>(
    () => Array(PHOTO_COUNT).fill(null)
  )

  const [stage, setStage] =
    useState<'camera' | 'design'>('camera')

  const [layoutId, setLayoutId] =
    useState<PhotoLayoutId>('4-cut')

  const [retakeSlot, setRetakeSlot] =
    useState<number | null>(null)

  const [themeId, setThemeId] =
    useState<StripTheme['id']>(THEMES[0].id)

  const [caption, setCaption] = useState('')
  const [showDate, setShowDate] = useState(false)
  const [createdAt, setCreatedAt] = useState(() => new Date())

  const [downloadStatus, setDownloadStatus] =
    useState<'idle' | 'preparing' | 'requested' | 'error'>('idle')

  const [saveError, setSaveError] = useState<string | null>(null)
  const downloadLock = useRef(false)

  const [restartOpen, setRestartOpen] = useState(false)
  const restartDialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = restartDialogRef.current
    if (!dialog) return

    if (restartOpen && !dialog.open) {
      dialog.showModal()
    } else if (!restartOpen && dialog.open) {
      dialog.close()
    }
  }, [restartOpen])

  const theme =
    THEMES.find((item) => item.id === themeId) ?? THEMES[0]

  const layout =
    PHOTO_LAYOUTS.find((item) => item.id === layoutId)
    ?? PHOTO_LAYOUTS[0]

  const complete =
    photos.length === layout.count && photos.every(Boolean)

  const saving = downloadStatus === 'preparing'

  function clearDownloadFeedback() {
    setDownloadStatus('idle')
    setSaveError(null)
  }

  function changeLayout(nextId: PhotoLayoutId) {
    const next = PHOTO_LAYOUTS.find(
      (item) => item.id === nextId
    )

    if (!next || next.id === layout.id || saving) return

    // Keep all existing photos when two layouts use
    // the same number of shots.
    if (
      stage === 'design' &&
      next.count === photos.length
    ) {
      setLayoutId(next.id)
      clearDownloadFeedback()
      return
    }

    // Layout changes that alter the number of shots
    // are allowed only before the first capture.
    if (
      stage !== 'camera' ||
      photos.some(Boolean)
    ) return

    setLayoutId(next.id)
    setPhotos(Array(next.count).fill(null))
    setRetakeSlot(null)
    setCreatedAt(new Date())
    clearDownloadFeedback()
  }

  function savePhoto(index: number, image: string) {
    setPhotos((previous) =>
      previous.map((photo, slot) =>
        slot === index ? image : photo
      )
    )
  }

  function resetSession() {
    setLayoutId('4-cut')
    setPhotos(Array(PHOTO_COUNT).fill(null))
    setRetakeSlot(null)
    setStage('camera')
    setCreatedAt(new Date())
    setThemeId(THEMES[0].id)
    setCaption('')
    setShowDate(false)
    clearDownloadFeedback()
  }

  function requestReset() {
    if (saving) return

    if (photos.some(Boolean)) {
      setRestartOpen(true)
    } else {
      resetSession()
    }
  }

  function confirmReset() {
    setRestartOpen(false)
    resetSession()
  }

  function designStrip() {
    setRetakeSlot(null)
    setStage('design')
  }

  function retake(index: number) {
    clearDownloadFeedback()
    setRetakeSlot(index)
    setStage('camera')
  }

  function cancelReviewRetake() {
    setRetakeSlot(null)
    setStage('design')
  }

  async function save() {
    if (
      !complete ||
      downloadLock.current ||
      restartOpen
    ) return

    downloadLock.current = true
    setSaveError(null)
    setDownloadStatus('preparing')

    try {
      await downloadStrip(
        photos,
        theme,
        caption,
        showDate,
        createdAt,
        layout,
      )

      setDownloadStatus('requested')
    } catch (cause) {
      setSaveError(
        cause instanceof Error
          ? cause.message
          : 'Could not prepare your PNG. Please try again.'
      )
      setDownloadStatus('error')
    } finally {
      downloadLock.current = false
    }
  }

  return (
    <main
      className={`site-shell ${
        stage === 'camera' ? 'booth-capture-page' : ''
      }`}
    >
      {stage === 'camera' ? (
        <div className="booth-page">
          <CameraSession
            photos={photos}
            layout={layout}
            onLayoutChange={changeLayout}
            retakeSlot={retakeSlot}
            onPhoto={savePhoto}
            onDesign={designStrip}
            onCancelRetake={cancelReviewRetake}
            onReset={requestReset}
          />
        </div>
      ) : (
        <div className="mx-auto w-full max-w-6xl px-4 py-6 md:py-10">
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <PhotoReview
              photos={photos}
              onRetake={retake}
              onReset={requestReset}
              saving={saving}
            />

            <aside
              className="preview-card"
              aria-label="Photo strip customization"
            >
              <div className="preview-stage">
                <StripPreview
                  photos={photos}
                  layout={layout}
                  theme={theme}
                  caption={caption}
                  showDate={showDate}
                  createdAt={createdAt}
                />
              </div>

              <div className="customizer">
                <span className="field-label">Layout</span>

                <div
                  className="design-layout-options"
                  role="group"
                  aria-label="Photo layout"
                >
                  {PHOTO_LAYOUTS
                    .filter((option) =>
                      option.count === layout.count
                    )
                    .map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        className={`design-layout-choice ${
                          layout.id === option.id
                            ? 'design-layout-choice-active'
                            : ''
                        }`}
                        aria-pressed={layout.id === option.id}
                        disabled={saving}
                        onClick={() => changeLayout(option.id)}
                      >
                        {option.name}
                      </button>
                    ))}
                </div>

                <span className="field-label">
                  Background
                </span>

                <div className="theme-options">
                  {THEMES.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={`theme-option ${
                        themeId === option.id
                          ? 'theme-option-selected'
                          : ''
                      }`}
                      onClick={() => {
                        setThemeId(option.id)
                        clearDownloadFeedback()
                      }}
                      disabled={saving}
                      aria-pressed={themeId === option.id}
                      title={option.detail}
                    >
                      <div
                        className="theme-swatch"
                        style={{
                          backgroundColor: option.background,
                          aspectRatio:
                            `${layout.width} / ${layout.height}`,
                        }}
                        aria-hidden="true"
                      >
                        <LayoutPhotos
                          photos={photos}
                          layout={layout}
                          mini
                        />
                      </div>

                      <span className="theme-name">
                        {option.name}
                      </span>
                    </button>
                  ))}
                </div>

                <label
                  className="field-label"
                  htmlFor="strip-caption"
                >
                  Caption
                </label>

                <input
                  id="strip-caption"
                  className="caption-input"
                  value={caption}
                  onChange={(event) => {
                    setCaption(event.target.value)
                    clearDownloadFeedback()
                  }}
                  disabled={saving}
                  maxLength={38}
                  placeholder="Optional"
                />

                <label className="date-toggle">
                  <input
                    type="checkbox"
                    checked={showDate}
                    onChange={(event) => {
                      setShowDate(event.target.checked)
                      clearDownloadFeedback()
                    }}
                    disabled={saving}
                  />

                  <span>Date</span>
                </label>

                <button
                  type="button"
                  className="button button-download"
                  onClick={() => void save()}
                  disabled={!complete || saving}
                  aria-busy={saving}
                >
                  <span className="download-button-content">
                    {saving && (
                      <span
                        className="download-spinner"
                        aria-hidden="true"
                      />
                    )}

                    {downloadStatus === 'preparing'
                      ? 'Preparing PNG…'
                      : downloadStatus === 'requested'
                        ? 'Download again'
                        : downloadStatus === 'error'
                          ? 'Try download again'
                          : 'Download PNG'}
                  </span>
                </button>

                {downloadStatus === 'preparing' && (
                  <p
                    className="download-feedback"
                    role="status"
                    aria-live="polite"
                  >
                    Creating your high-quality photo strip…
                  </p>
                )}

                {downloadStatus === 'requested' && (
                  <p
                    className="download-feedback download-feedback-requested"
                    role="status"
                    aria-live="polite"
                  >
                    <span aria-hidden="true">✓ </span>
                    Download requested. Check your browser's Downloads.
                  </p>
                )}

                {downloadStatus === 'error' && (
                  <div
                    className="download-feedback download-feedback-error"
                    role="alert"
                  >
                    <strong>
                      Couldn't prepare your PNG.
                    </strong>
                    <span>{saveError}</span>
                    <span>
                      Your photos are still here. Select Try download again.
                    </span>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      )}

      <dialog
        ref={restartDialogRef}
        className="restart-confirmation"
        role="alertdialog"
        aria-labelledby="restart-confirmation-title"
        aria-describedby="restart-confirmation-description"
        onCancel={() => setRestartOpen(false)}
        onClose={() => setRestartOpen(false)}
      >
        <div className="restart-confirmation-content">
          <h2 id="restart-confirmation-title">
            Start over?
          </h2>

          <p id="restart-confirmation-description">
            This will erase your captured photos and reset your strip settings.
            You won't be able to recover the photos afterward.
          </p>

          <div className="restart-confirmation-actions">
            <button
              type="button"
              className="button button-outline restart-confirmation-cancel"
              autoFocus
              onClick={() => setRestartOpen(false)}
            >
              Keep my photos
            </button>

            <button
              type="button"
              className="button restart-confirmation-delete"
              onClick={confirmReset}
            >
              Delete &amp; start over
            </button>
          </div>
        </div>
      </dialog>
    </main>
  )
}
