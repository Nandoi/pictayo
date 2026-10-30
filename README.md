# PicTayo 📸

PicTayo is a web-based photobooth for capturing memories together. It is also a hands-on software engineering learning project focused on React, TypeScript, browser APIs, Git, and maintainable architecture.

## Roadmap

**Phase 1 — Single device (MVP)**: Use one laptop camera to preview and capture four photos, retake individual shots, choose a custom fixed-size photo-strip template, and download a finished PNG.

**Phase 2 — Dual device (future)**: Two people join a session from separate devices, capture four photos each, and assemble an eight-photo layout with four rows and two columns.

## Tech stack

- React 19 + TypeScript 6
- Vite 8
- Tailwind CSS 4
- Browser `navigator.mediaDevices.getUserMedia()` for camera input
- HTML Canvas API for photo composition and PNG export
- No backend or database for the single-device MVP

## Local development

Requirements: compatible Node.js and npm versions.

```bash
npm ci
npm run dev
```

Open the localhost URL printed by Vite (normally http://localhost:5173).

### Checks

```bash
npm run lint
npm run build
```

## Project documentation

- [Tracker](./TRACKER.md) — work completed, in progress, and upcoming
- [Architecture](./docs/ARCHITECTURE.md) — responsibilities and design decisions
- [Git workflow](./docs/GIT_WORKFLOW.md) — branching, review, and commits
- [Learning log](./docs/LEARNING_LOG.md) — concepts and lessons practiced

## Development approach

Changes are made in focused branches and merged to `main` through reviewed pull requests. We prefer understandable code over premature abstractions. Browser photos stay local for Phase 1 unless the user explicitly downloads them.

> Privacy: Never commit private photographs, camera captures, secrets, or personal tokens to the repository.
