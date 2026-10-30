# PicTayo — Architecture (Version 1)

Keep Version 1 small. It is a client-only React app; no backend, database, or separate state library is required.

```text
src/
  App.tsx
  index.css
  features/
    camera/
      camera.ts
      useCamera.ts
      CameraPreview.tsx
    photobooth/
      Photobooth.tsx
      strip.ts
```

## Responsibilities

- **camera.ts** — requests/stops browser media streams and snapshots a mirrored frame to a JPEG data URL.
- **useCamera.ts** — owns the media stream during the camera component's React lifecycle and exposes retry/error/loading state.
- **CameraPreview.tsx** — renders the video feed, permissions/errors, and countdown overlay.
- **Photobooth.tsx** — handles the four-shot session, retakes, style selection, text/date customization, and the UI.
- **strip.ts** — defines three data-driven themes and composes four photos into a fixed 1200 × 3200 PNG using Canvas.

## Single-device flow

```text
Browser camera → 4 countdown shots → review / retake → choose theme
→ edit caption/date → preview → Canvas export → local PNG download
```

Photo data is held only in React state as data URLs. No network or storage requests are made for photo capture or export.

## Key decisions

1. **No backend for V1.** Keep photos local and minimize moving parts.
2. **No premature subfolders.** Each feature has files only; split when it becomes necessary.
3. **Canvas export is separate.** UI preview uses the same four-slot layout and theme properties; the saved file uses a fixed pixel size.
4. **Camera is released on stage change.** Switching from capture to review unmounts the camera component and stops tracks. Retakes remount it.
5. **Future dual-device mode is out of scope.** Requires networking, consent, synchronization, and possibly a backend.

## Quality gates

Lint, production build, camera permission denied/retry, four captures, individual retake, all themes, caption/date, PNG size, camera cleanup, and responsive layout must be checked before merging the V1 PR.
