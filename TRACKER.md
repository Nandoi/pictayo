# PicTayo — Project Tracker

**Updated:** 2026-10-30  
**Current milestone:** M0 documentation; M1 camera preview next  
**Workflow:** Backlog → In progress → In review → Done

A task counts as **Done** when it is merged into `main` and its acceptance criteria are satisfied. Planning decisions may be marked done when documented.

## Milestones

| Milestone | Status | Outcome |
| --- | --- | --- |
| M0 — Project foundation | In progress | Vite, TypeScript, ESLint, Tailwind; documentation to finish |
| M1 — Camera preview | Backlog | Browser permission, live preview, errors, track cleanup |
| M2 — Photo capture | Backlog | Countdown, four shots, individual retakes |
| M3 — Templates | Backlog | Fixed-size customizable photo-strip layouts |
| M4 — Export | Backlog | Composited photo strip downloaded as PNG |
| M5 — Quality and polish | Backlog | Tests, usability, responsive design |
| Future — Dual-device mode | Later | Connection, synchronized capture, paired 2×4 grid |

## Completed

- [x] Define single-device MVP and future dual-device requirements.
- [x] Scaffold React + TypeScript with Vite; resolve initial TypeScript/ESLint conflict.
- [x] Initialize Git repository, make initial commit, and push to GitHub.
- [x] Configure Tailwind and remove unused Vite starter UI.
- [x] Review and merge [PR #1](https://github.com/Nandoi/pictayo/pull/1) into `main` (merge commit `385896b`).

## Now — M0 documentation

- [ ] Create `docs/project-documentation` branch from updated `main`.
- [ ] Replace the placeholder README with a project-specific introduction.
- [ ] Add `TRACKER.md`, `docs/ARCHITECTURE.md`, `docs/GIT_WORKFLOW.md`, and `docs/LEARNING_LOG.md`.
- [ ] Check the Markdown links and readability.
- [ ] Run `npm run lint` and `npm run build` (no regressions).
- [ ] Commit, push, open a PR, review, and merge into `main`.

## Next — M1 camera preview

- [ ] Create `feature/camera-preview` from updated `main`.
- [ ] Add a small camera service (browser MediaDevices access).
- [ ] Add `useCamera` hook for camera state and cleanup.
- [ ] Show live camera preview in a component.
- [ ] Display permission-denied and device-not-found states.
- [ ] Stop all media tracks on cleanup.
- [ ] Test on `localhost` and ensure lint/build pass.
- [ ] Review and merge PR; update tracker and learning log.

## Future work

**M2 — Capture:** Four snapshots, countdown, ordered photos, individual retake, resource cleanup.

**M3 — Templates:** Typed dimensions and slots, a default four-photo strip, additional custom overlays, template chooser.

**M4 — Export:** Canvas rendering, photo cropping/fitting, output PNG download, pixel-size verification.

**M5 — Quality:** Unit tests for photo/session/template logic, camera failure-state manual tests, accessibility, mobile layout.

**Phase 2:** Two-participant rooms, coordination/signaling, synchronization and reconnection, 2-column × 4-row export.

## Session log

| Date | Work | Outcome |
| --- | --- | --- |
| 2026-10-30 | Scoped PicTayo and selected technology | MVP and future dual-device goal defined |
| 2026-10-30 | Initialized local app and Git | Initial `main` commit pushed |
| 2026-10-30 | Reviewed and merged PR #1 | Tailwind setup and starter cleanup merged |
| 2026-10-30 | Began documentation milestone | Files prepared; PR pending |

## After every PR

1. Record the PR number, branch, checks, and merge outcome.
2. Mark completed tasks; leave unmerged work as in progress.
3. Add a short note in `docs/LEARNING_LOG.md`.
4. Choose the next smallest meaningful feature.
