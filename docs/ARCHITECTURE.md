# PicTayo — Architecture

## Design goals

1. Keep the single-device MVP small and understandable.
2. Separate UI presentation from browser camera access and session operations.
3. Keep photo templates as data; don't hard-code each template as its own entire app.
4. Keep export independent of the camera so the same renderer can later handle two devices.
5. Build features in small increments, rather than creating empty layers in advance.

## Phase 1 data flow

```text
Camera preview (getUserMedia)
    → capture still photo
    → ordered photo-session state
    → selected photo-strip template
    → Canvas composition
    → PNG download
```

## Planned feature-oriented structure

```text
src/
  App.tsx                   # App composition
  features/
    camera/
      components/            # CameraPreview, CameraStatus
      hooks/                 # useCamera: lifecycle and UI state
      services/              # browser media access
    photo-session/
      components/            # Countdown, PhotoReview
      model/                 # photo order, retakes, session types
    templates/
      components/            # TemplateSelector
      model/                 # template/slot types
      data/                  # fixed-size template definitions
    export/
      services/              # Canvas drawing and PNG generation
  shared/                    # Only code shared by multiple features
```

This is a **plan**, not a requirement to create every folder now. We will add a folder when it has real code.

## Responsibility boundaries

| Part | Does | Does not do |
| --- | --- | --- |
| Camera service | Requests/stops browser media streams | Render UI or export photos |
| Camera hook | Coordinates stream, status, and cleanup in React | Define templates or download files |
| Camera component | Displays video and useful error messages | Own unrelated photo session logic |
| Photo session | Orders captured photos and retakes | Request browser permissions |
| Template model | Defines dimensions, slots, and optional overlays | Access live camera streams |
| Export service | Composes existing photos in Canvas | Decide when the user takes a photo |

## Initial design decisions

**ADR-001 — No backend in Phase 1.** Photos only need to be kept for the browser session and downloaded. Avoid remote storage until a feature requires it.

**ADR-002 — Feature folders.** Keep related UI, hooks, and services together, rather than one giant `components` folder.

**ADR-003 — Data-driven templates.** Each template defines fixed dimensions and photo-slot positions. Future dual-device layouts can use the same renderer.

**ADR-004 — Minimal dependencies.** Start with React hooks and browser APIs. Add state libraries or Canvas wrappers only for a demonstrated need.

**ADR-005 — Resource lifecycle.** Stop camera tracks when done and release temporary photo URLs where appropriate.

## Quality criteria

- ESLint and production build pass for every PR.
- Camera error states are handled, not swallowed.
- Features have clear ownership; related logic isn't duplicated.
- Document important tradeoffs and future changes.

## Deferred until dual-device mode

A signaling service, room joining, networking, synchronization, and server-side persistence are **not** required for the single-device MVP.
