# PicTayo 📸

An at-home photobooth for capturing four little moments and turning them into one printable keepsake. **Version 1 runs entirely inside the browser**: no accounts, backend, database, or photo uploads.

## Version 1 — What works

- Live mirrored camera preview and clear permission/device errors, with retry.
- One-click **4-photo session** with a three-second countdown for every shot.
- Review all four photos and retake any individual frame.
- Three fixed-size strip styles: **Peachy**, **Paper**, and **After Dark**.
- Editable strip caption (up to 38 characters) and optional date.
- Live photo-strip preview and a **1200 × 3200 PNG** download.
- Responsive layout for laptop and mobile browsers.
- Camera tracks stop when you leave the camera stage or close the page.

## Run locally

Requires Node.js supported by Vite 8 and npm.

```bash
npm ci
npm run dev
```

Open the address Vite prints (usually `http://localhost:5173`). Camera access requires a secure context: **localhost or HTTPS**. Choose **Allow** when your browser asks to use the camera.

```bash
npm run lint
npm run build
```

## How to use

1. **Start taking photos** to capture four frames automatically (3-second countdown each).
2. Tap any captured frame to retake it, then choose **Design my strip**.
3. Choose a style, edit the caption, and choose whether to show the date.
4. Click **Download photo strip** to save a full-resolution PNG.
5. Use **Start a new session** to take a fresh set of photos.

For best results, use an up-to-date Chrome, Edge, Safari, or Firefox browser with a working camera. On a mobile device, the site must be hosted on HTTPS (not an unsecured LAN IP).

## Code layout

```text
src/
  App.tsx
  index.css
  features/
    camera/
      camera.ts           # Browser camera + still capture
      useCamera.ts        # Media stream lifetime and retry
      CameraPreview.tsx   # Video viewport, status, countdown
    photobooth/
      Photobooth.tsx      # 4-shot session, retakes, customization UI
      strip.ts            # Three templates and Canvas PNG export
```

See [TRACKER.md](./TRACKER.md), [architecture](./docs/ARCHITECTURE.md), and [Git workflow](./docs/GIT_WORKFLOW.md).

## Privacy and limits

Captured photos stay in the current browser tab's memory until you reset or close it. They are not uploaded or automatically persisted. Download your strip before closing or refreshing. The downloaded file is a PNG; the browser may save it to your device's Downloads folder.

Version 1 is **single-device only**. A future version may support two people joining from separate devices and assembling their photos into a 2-column × 4-row layout.

Please do not commit personal camera captures, `.env` files, secrets, or private photographs.
