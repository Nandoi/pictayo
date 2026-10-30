import { useEffect, useRef, useState } from 'react'
import { CameraPreview } from '../camera/CameraPreview'
import { capturePhoto } from '../camera/camera'
import { useCamera } from '../camera/useCamera'
import { dateLabel, downloadStrip, PHOTO_COUNT, THEMES } from './strip'
import type { PhotoSlots, StripTheme } from './strip'
import './capture-feedback.css'

const COUNTDOWN_SECONDS = 3
const FLASH_DURATION = 750
const SAVED_FEEDBACK_DURATION = 1800

const sleep = (ms: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, ms))

type CameraSessionProps = {
  photos: PhotoSlots
  retakeSlot: number | null
  onPhoto: (index: number, dataUrl: string) => void
  onDesign: () => void
  onCancelRetake: () => void
  onReset: () => void
}

function CameraSession({
  photos,
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
  const [selectedRetake, setSelectedRetake] = useState<number | null>(null)
  const [savedPhoto, setSavedPhoto] = useState<number | null>(null)
  const [freshPhoto, setFreshPhoto] = useState<number | null>(null)
  const runId = useRef(0)
  const feedbackTimer = useRef<number | null>(null)
  const capturing = useRef(false)

  const completed = photos.every(Boolean)
  const remaining = photos.filter((photo) => !photo).length
  const taken = PHOTO_COUNT - remaining
  const nextShot = photos.findIndex((photo) => photo === null)
  // A selection never starts the camera countdown by itself.
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
    if (capturing.current || busy || retakeSlot !== null || !photos[index]) return
    clearFeedback()
    setCaptureError(null)
    setSelectedRetake((previous) => previous === index ? null : index)
  }

  function cancelRetake() {
    if (capturing.current || busy) return
    clearFeedback()
    setCaptureError(null)
    if (retakeSlot !== null) {
      onCancelRetake() // Return to the review screen with the original photo.
    } else {
      setSelectedRetake(null)
    }
  }

  async function takeShot(index: number, finishAfter = false) {
    if (capturing.current || busy || loading || error || !ready || index < 0) return

    const video = videoRef.current
    if (!video) return

    const id = ++runId.current
    capturing.current = true
    clearFeedback()
    setBusy(true)
    setCurrentShot(index)
    setCaptureError(null)

    try {
      for (let second = COUNTDOWN_SECONDS; second >= 1; second--) {
        setCountdown(second)
        await sleep(1000)
        if (runId.current !== id) return
      }

      // Capture exactly one frame, then briefly flash the camera.
      const image = capturePhoto(video)
      onPhoto(index, image)
      setFreshPhoto(index)
      setCountdown('flash')
      await sleep(FLASH_DURATION)
      if (runId.current !== id) return
      setCountdown(null)
      setSelectedRetake(null)

      // Feedback disappears automatically, but the next shot never starts on its own.
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
          cause instanceof Error ? cause.message : 'Could not capture photo.'
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
          <div className="booth-saved-feedback" role="status" aria-live="polite">
            <span className="booth-saved-check" aria-hidden="true">✓</span>
            Photo {savedPhoto + 1} saved
          </div>
        )}
      </div>

      <aside className="booth-controls" aria-label="Capture controls">
        <div className="booth-controls-top">
          <div className="booth-progress" aria-live="polite">
            {taken} of {PHOTO_COUNT} taken
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
              busy || loading || !ready || Boolean(error) ||
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
            <p className="inline-error" role="alert">{captureError}</p>
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
        <div className="shots-row booth-shots-row">
          {Array.from({ length: PHOTO_COUNT }, (_, index) => (
            <button
              key={index}
              type="button"
              className={`shot-thumb ${
                photos[index] ? 'shot-thumb-filled' : ''
              } ${currentShot === index ? 'shot-thumb-active' : ''} ${
                selectedPhoto === index ? 'shot-thumb-selected' : ''
              } ${freshPhoto === index ? 'shot-thumb-new' : ''}`}
              disabled={
                !photos[index] || busy || loading || Boolean(error) ||
                !ready || retakeSlot !== null
              }
              onClick={() => selectRetake(index)}
              aria-pressed={photos[index] ? selectedPhoto === index : undefined}
              aria-label={photos[index]
                ? selectedPhoto === index
                  ? `Photo ${index + 1} selected for retake`
                  : `Select photo ${index + 1} to retake`
                : `Photo ${index + 1} not taken`}
              title={photos[index]
                ? selectedPhoto === index
                  ? `Photo ${index + 1} selected. Press Retake photo ${index + 1} to capture.`
                  : `Select photo ${index + 1} to retake`
                : `Photo ${index + 1} not taken`}
            >
              {photos[index] ? (
                <img src={photos[index]} alt={`Photo ${index + 1}`} />
              ) : (
                <span className="shot-thumb-number">0{index + 1}</span>
              )}
              {photos[index] && (
                <span className="shot-retake-indicator" aria-hidden="true">
                  <span className="booth-retake-symbol">↻</span>
                  <span className="booth-retake-text">
                    {selectedPhoto === index ? 'Selected' : 'Retake'}
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

type StripPreviewProps = {
  photos: PhotoSlots
  theme: StripTheme
  caption: string
  showDate: boolean
  createdAt: Date
}

function StripPreview({
  photos,
  theme,
  caption,
  showDate,
  createdAt,
}: StripPreviewProps) {
  return (
    <div
      className="strip"
      style={{ backgroundColor: theme.background, color: theme.ink }}
      aria-label="Photo strip preview"
    >
      <div className="strip-header" />
      <div className="strip-frames">
        {Array.from({ length: PHOTO_COUNT }, (_, index) => (
          <div
            key={index}
            className="strip-frame"
            style={{ backgroundColor: theme.frame, borderColor: theme.photoMat }}
          >
            {photos[index] ? (
              <img src={photos[index]} alt={`Strip photo ${index + 1}`} />
            ) : (
              <div className="strip-empty"><span>0{index + 1}</span></div>
            )}
          </div>
        ))}
      </div>
      <div className="strip-footer">
        <span className="strip-accent" style={{ backgroundColor: theme.accent }} />
        {caption.trim() && (
          <strong
            style={{
              fontFamily: theme.font,
              fontSize: caption.length > 30 ? 8 : caption.length > 23 ? 10 : 13,
            }}
          >
            {caption.trim()}
          </strong>
        )}
        {showDate && (
          <span className="strip-date">{dateLabel(createdAt).toUpperCase()}</span>
        )}
      </div>
    </div>
  )
}

type ReviewProps = {
  photos: PhotoSlots
  onRetake: (slot: number) => void
  onReset: () => void
}

function PhotoReview({ photos, onRetake, onReset }: ReviewProps) {
  return (
    <section className="studio-card" aria-label="Photo review">
      <div className="review-grid">
        {photos.map((photo, index) => (
          <div className="review-photo" key={index}>
            {photo && <img src={photo} alt={`Photo ${index + 1}`} />}
            <span className="review-photo-index">0{index + 1}</span>
            <button type="button" onClick={() => onRetake(index)}>Retake</button>
          </div>
        ))}
      </div>
      <div className="review-bottom">
        <button type="button" className="button button-outline" onClick={onReset}>
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
  const [stage, setStage] = useState<'camera' | 'design'>('camera')
  const [retakeSlot, setRetakeSlot] = useState<number | null>(null)
  const [themeId, setThemeId] = useState<StripTheme['id']>(THEMES[0].id)
  const [caption, setCaption] = useState('')
  const [showDate, setShowDate] = useState(false)
  const [createdAt, setCreatedAt] = useState(() => new Date())
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const theme = THEMES.find((item) => item.id === themeId) ?? THEMES[0]
  const complete = photos.length === PHOTO_COUNT && photos.every(Boolean)

  function savePhoto(index: number, image: string) {
    setPhotos((previous) => previous.map((photo, slot) =>
      slot === index ? image : photo
    ))
  }

  function resetSession() {
    setPhotos(Array(PHOTO_COUNT).fill(null))
    setRetakeSlot(null)
    setStage('camera')
    setCreatedAt(new Date())
    setSaveError(null)
  }

  function designStrip() {
    setRetakeSlot(null)
    setStage('design')
  }

  function retake(index: number) {
    setRetakeSlot(index)
    setStage('camera')
  }

  function cancelReviewRetake() {
    setRetakeSlot(null)
    setStage('design')
  }

  async function save() {
    if (!complete || saving) return
    setSaveError(null)
    setSaving(true)

    try {
      await downloadStrip(photos, theme, caption, showDate, createdAt)
    } catch (cause) {
      setSaveError(
        cause instanceof Error ? cause.message : 'Could not download the strip.'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className={`site-shell ${stage === 'camera' ? 'booth-capture-page' : ''}`}>
      {stage === 'camera' ? (
        <div className="booth-page">
          <CameraSession
            photos={photos}
            retakeSlot={retakeSlot}
            onPhoto={savePhoto}
            onDesign={designStrip}
            onCancelRetake={cancelReviewRetake}
            onReset={resetSession}
          />
        </div>
      ) : (
        <div className="mx-auto w-full max-w-6xl px-4 py-6 md:py-10">
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <PhotoReview photos={photos} onRetake={retake} onReset={resetSession} />

            <aside className="preview-card" aria-label="Photo strip customization">
              <div className="preview-stage">
                <StripPreview
                  photos={photos}
                  theme={theme}
                  caption={caption}
                  showDate={showDate}
                  createdAt={createdAt}
                />
              </div>

              <div className="customizer">
                <div className="theme-options">
                  {THEMES.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={`theme-option ${
                        themeId === option.id ? 'theme-option-selected' : ''
                      }`}
                      onClick={() => setThemeId(option.id)}
                      aria-pressed={themeId === option.id}
                    >
                      <span
                        className="theme-swatch"
                        style={{
                          backgroundColor: option.background,
                          borderColor: option.photoMat,
                        }}
                      >
                        <span style={{ backgroundColor: option.frame }} />
                        <span style={{ backgroundColor: option.frame }} />
                        <span style={{ backgroundColor: option.frame }} />
                      </span>
                      <span className="theme-name">{option.name}</span>
                    </button>
                  ))}
                </div>

                <label className="field-label" htmlFor="strip-caption">Caption</label>
                <input
                  id="strip-caption"
                  className="caption-input"
                  value={caption}
                  onChange={(event) => setCaption(event.target.value)}
                  maxLength={38}
                  placeholder="Optional"
                />

                <label className="date-toggle">
                  <input
                    type="checkbox"
                    checked={showDate}
                    onChange={(event) => setShowDate(event.target.checked)}
                  />
                  <span>Date</span>
                </label>

                <button
                  type="button"
                  className="button button-download"
                  onClick={() => void save()}
                  disabled={!complete || saving}
                >
                  {saving ? 'Preparing...' : 'Download'}
                </button>
                {saveError && (
                  <p className="inline-error" role="alert">{saveError}</p>
                )}
              </div>
            </aside>
          </div>
        </div>
      )}
    </main>
  )
}
