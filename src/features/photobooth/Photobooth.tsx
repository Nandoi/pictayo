import { useEffect, useRef, useState } from 'react'
import { CameraPreview } from '../camera/CameraPreview'
import { capturePhoto } from '../camera/camera'
import { useCamera } from '../camera/useCamera'
import { dateLabel, downloadStrip, PHOTO_COUNT, THEMES } from './strip'
import type { PhotoSlots, StripTheme } from './strip'

const sleep = (duration: number) => new Promise<void>((resolve) => window.setTimeout(resolve, duration))

type CameraSessionProps = {
  photos: PhotoSlots
  retakeSlot: number | null
  onPhoto: (index: number, dataUrl: string) => void
  onDesign: () => void
  onReset: () => void
}

function CameraSession({ photos, retakeSlot, onPhoto, onDesign, onReset }: CameraSessionProps) {
  const { videoRef, error, loading, retry } = useCamera()
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [countdown, setCountdown] = useState<number | 'flash' | null>(null)
  const [currentShot, setCurrentShot] = useState<number | null>(null)
  const [captureError, setCaptureError] = useState<string | null>(null)
  const runId = useRef(0)
  const completed = photos.every(Boolean)
  const remaining = photos.filter((photo) => !photo).length

  useEffect(() => () => { runId.current += 1 }, [])

  async function takeShots(targets: number[], finishAfter = false) {
    if (busy || loading || error || !ready || targets.length === 0) return
    const video = videoRef.current
    if (!video) return

    const id = ++runId.current
    setBusy(true)
    setCaptureError(null)

    try {
      for (const index of targets) {
        if (runId.current !== id) return
        setCurrentShot(index)
        for (let second = 3; second >= 1; second--) {
          setCountdown(second)
          await sleep(1000)
          if (runId.current !== id) return
        }
        const image = capturePhoto(video)
        onPhoto(index, image)
        setCountdown('flash')
        await sleep(220)
        if (runId.current !== id) return
        setCountdown(null)
        await sleep(550)
      }
      if (runId.current !== id) return
      if (finishAfter) onDesign()
    } catch (cause) {
      if (runId.current === id) {
        setCaptureError(cause instanceof Error ? cause.message : 'Something went wrong capturing your photo.')
      }
    } finally {
      if (runId.current === id) {
        setCountdown(null)
        setCurrentShot(null)
        setBusy(false)
      }
    }
  }

  function startSession() {
    if (retakeSlot !== null) {
      void takeShots([retakeSlot], true)
    } else {
      const targets = photos.flatMap((photo, index) => photo === null ? [index] : [])
      void takeShots(targets)
    }
  }

  return (
    <section className="studio-card" aria-label="Camera studio">
      <div className="section-head">
        <div>
          <span className="eyebrow">01 / THE CAMERA</span>
          <h2>{retakeSlot !== null ? `Let’s redo frame ${retakeSlot + 1}` : completed ? 'That’s a wrap!' : 'Ready, set, smile!'}</h2>
          <p>{retakeSlot !== null ? 'One more shot, just how you like it.' : completed ? 'All four moments captured. Review them or design your strip.' : 'We’ll take four photos, with a 3-second countdown before each one.'}</p>
        </div>
        <span className="camera-step-count">{completed ? '4' : PHOTO_COUNT - remaining}<span> / 4</span></span>
      </div>

      <CameraPreview
        videoRef={videoRef}
        loading={loading}
        error={error}
        onRetry={() => { setReady(false); retry() }}
        onReady={() => setReady(true)}
        countdown={countdown}
      />

      <div className="capture-toolbar">
        <button
          type="button"
          className="button button-primary button-capture"
          onClick={startSession}
          disabled={busy || loading || !ready || Boolean(error) || (completed && retakeSlot === null)}
        >
          <span className="shutter-icon" aria-hidden="true" />
          {busy ? `Capturing frame ${(currentShot ?? 0) + 1} of 4…` : retakeSlot !== null ? `Retake frame ${retakeSlot + 1}` : remaining === 4 ? 'Start taking photos' : remaining > 0 ? `Capture remaining ${remaining}` : 'All photos captured'}
        </button>
        {completed && retakeSlot === null && (
          <button type="button" className="button button-dark" onClick={onDesign} disabled={busy}>
            Design my strip <span aria-hidden="true">↗</span>
          </button>
        )}
      </div>
      {captureError && <p className="inline-error" role="alert">{captureError}</p>}

      <div className="shots-heading"><strong>Your four moments</strong><span>{completed ? 'Tap a frame to retake it' : 'The memories are adding up…'}</span></div>
      <div className="shots-row">
        {Array.from({ length: PHOTO_COUNT }, (_, index) => (
          <button
            key={index}
            type="button"
            className={`shot-thumb ${photos[index] ? 'shot-thumb-filled' : ''} ${currentShot === index ? 'shot-thumb-active' : ''}`}
            disabled={!photos[index] || busy || loading || Boolean(error) || !ready || retakeSlot !== null}
            onClick={() => void takeShots([index])}
            title={photos[index] ? `Retake photo ${index + 1}` : `Photo ${index + 1} not taken`}
          >
            {photos[index] ? <img src={photos[index]!} alt={`Captured frame ${index + 1}`} /> : <span className="shot-thumb-number">0{index + 1}</span>}
            {photos[index] && <span className="shot-retake-indicator" aria-hidden="true">↻</span>}
          </button>
        ))}
      </div>
      <div className="studio-bottom">
        <span>✦ Your photos never leave this browser.</span>
        {completed && retakeSlot === null && <button type="button" className="text-button" onClick={onReset}>Start over</button>}
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

function StripPreview({ photos, theme, caption, showDate, createdAt }: StripPreviewProps) {
  return (
    <div className="strip" style={{ backgroundColor: theme.background, color: theme.ink }} aria-label="Live photo strip preview">
      <div className="strip-header">
        <strong>pictayo.</strong>
        <small>FOUR LITTLE MOMENTS · ONE FOREVER MEMORY</small>
        <span className="strip-dots" style={{ backgroundColor: theme.accent }} />
      </div>
      <div className="strip-frames">
        {Array.from({ length: PHOTO_COUNT }, (_, index) => (
          <div key={index} className="strip-frame" style={{ backgroundColor: theme.frame, borderColor: theme.photoMat }}>
            {photos[index]
              ? <img src={photos[index]!} alt={`Photo strip frame ${index + 1}`} />
              : <div className="strip-empty"><span>✳</span><small>FRAME 0{index + 1}</small></div>}
          </div>
        ))}
      </div>
      <div className="strip-footer">
        <span className="strip-accent" style={{ backgroundColor: theme.accent }} />
        <strong style={{ fontFamily: theme.font, fontSize: caption.length > 30 ? 8 : caption.length > 23 ? 10 : 13 }}>{caption.trim() || 'our little moments'}</strong>
        <small>KEEP THIS MOMENT CLOSE</small>
        {showDate && <span className="strip-date">{dateLabel(createdAt).toUpperCase()}</span>}
        <span className="strip-credit">MADE WITH ♡ ON PICTAYO</span>
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
      <div className="section-head">
        <div>
          <span className="eyebrow">02 / PICK YOUR FAVORITES</span>
          <h2>Look at those memories.</h2>
          <p>Love all four? Perfect. Want a do-over? Pick a photo to retake.</p>
        </div>
        <span className="review-star" aria-hidden="true">✳</span>
      </div>
      <div className="review-grid">
        {photos.map((photo, index) => (
          <div className="review-photo" key={index}>
            {photo && <img src={photo} alt={`Captured photo ${index + 1}`} />}
            <span className="review-photo-index">0{index + 1}</span>
            <button type="button" onClick={() => onRetake(index)}>↻ Retake</button>
          </div>
        ))}
      </div>
      <div className="review-bottom">
        <div><strong>Looking good!</strong><p>Your strip is ready to personalize and save.</p></div>
        <button type="button" className="button button-outline" onClick={onReset}>Start a new session</button>
      </div>
    </section>
  )
}

export function Photobooth() {
  const [photos, setPhotos] = useState<PhotoSlots>(() => Array(PHOTO_COUNT).fill(null))
  const [stage, setStage] = useState<'camera' | 'design'>('camera')
  const [retakeSlot, setRetakeSlot] = useState<number | null>(null)
  const [themeId, setThemeId] = useState<StripTheme['id']>('peach')
  const [caption, setCaption] = useState('our little moments')
  const [showDate, setShowDate] = useState(true)
  const [createdAt, setCreatedAt] = useState(() => new Date())
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const theme = THEMES.find((item) => item.id === themeId) ?? THEMES[0]
  const complete = photos.length === PHOTO_COUNT && photos.every(Boolean)

  function savePhoto(index: number, image: string) {
    setPhotos((previous) => previous.map((photo, slot) => slot === index ? image : photo))
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

  async function save() {
    if (!complete || saving) return
    setSaveError(null)
    setSaving(true)
    try {
      await downloadStrip(photos, theme, caption, showDate, createdAt)
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : 'Could not save the strip. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="site-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="PicTayo homepage">
          <span className="brand-symbol" aria-hidden="true"><i /><i /><i /><i /></span>
          <span>pictayo<span className="brand-period">.</span></span>
        </a>
        <div className="header-end"><span className="header-tag">THE LITTLE PHOTOBOOTH</span><span className="header-privacy">✦ 100% IN YOUR BROWSER</span></div>
      </header>

      <main id="top" className="page-main">
        <section className="hero-copy">
          <div className="hero-eyebrow"><span className="hero-eyebrow-line" /> A PHOTOBOOTH FOR THE LITTLE THINGS</div>
          <h1>Make memories.<br /><em>Keep the moment.</em></h1>
          <p>Four little photos, one keepsake. Strike a pose, pick a frame, and make something worth saving.</p>
          <div className="hero-sparkle" aria-hidden="true">✳</div>
        </section>

        <div className="workspace">
          <div className="left-pane">
            <div className="step-indicator">
              <span className={stage === 'camera' ? 'step active' : 'step done'}><b>01</b> Capture</span>
              <span className="step-line" />
              <span className={stage === 'design' ? 'step active' : 'step'}><b>02</b> Personalize</span>
              <span className="step-line" />
              <span className="step"><b>03</b> Save forever</span>
            </div>
            {stage === 'camera'
              ? <CameraSession
                  photos={photos}
                  retakeSlot={retakeSlot}
                  onPhoto={savePhoto}
                  onDesign={designStrip}
                  onReset={resetSession}
                />
              : <PhotoReview photos={photos} onRetake={retake} onReset={resetSession} />}
            <p className="left-footer-note">NO LOGIN · NO UPLOADS · JUST YOU, YOUR CAMERA & A LITTLE MAGIC</p>
          </div>

          <aside className="right-pane" aria-label="Photo strip designer">
            <div className="preview-card">
              <div className="preview-header">
                <div><span className="eyebrow">YOUR KEEPSAKE</span><h2>The final strip <span>✳</span></h2></div>
                <span className="strip-dimensions">1200 × 3200 PX</span>
              </div>
              <div className="preview-stage"><StripPreview photos={photos} theme={theme} caption={caption} showDate={showDate} createdAt={createdAt} /></div>
              <div className="customizer">
                <div className="custom-heading"><strong>01 — Choose a vibe</strong><span>3 styles</span></div>
                <div className="theme-options">
                  {THEMES.map((option) => (
                    <button key={option.id} type="button" className={`theme-option ${themeId === option.id ? 'theme-option-selected' : ''}`} onClick={() => setThemeId(option.id)} aria-pressed={themeId === option.id}>
                      <span className="theme-swatch" style={{ backgroundColor: option.background, borderColor: option.photoMat }}><span style={{ backgroundColor: option.frame }} /><span style={{ backgroundColor: option.frame }} /><span style={{ backgroundColor: option.frame }} /></span>
                      <span className="theme-name">{option.name}</span>
                    </button>
                  ))}
                </div>
                <label className="field-label" htmlFor="strip-caption">02 — A little note</label>
                <input id="strip-caption" className="caption-input" value={caption} onChange={(event) => setCaption(event.target.value)} maxLength={38} placeholder="our little moments" />
                <div className="caption-meta"><span>Make it yours ♥</span><span>{caption.length}/38</span></div>
                <label className="date-toggle"><input type="checkbox" checked={showDate} onChange={(event) => setShowDate(event.target.checked)} /><span>Include today's date</span></label>
                <button type="button" className="button button-download" onClick={() => void save()} disabled={!complete || saving}>
                  {saving ? 'Preparing your PNG…' : '↓  Download photo strip'}
                </button>
                {!complete && <p className="download-hint">Capture all 4 photos to unlock your download.</p>}
                {complete && !saveError && <p className="download-hint">A full-resolution PNG, made just for you.</p>}
                {saveError && <p role="alert" className="inline-error">{saveError}</p>}
              </div>
            </div>
          </aside>
        </div>
      </main>
      <footer className="page-footer"><span>PICTAYO © {createdAt.getFullYear()}</span><span>MADE FOR MOMENTS THAT MATTER <span aria-hidden="true">♡</span></span><span>VERSION 1.0</span></footer>
    </div>
  )
}
