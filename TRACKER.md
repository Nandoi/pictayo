# PicTayo — Project Tracker

**Updated:** 2026-10-30  
**Current milestone:** V1 single-device photobooth — implementation and PR pending  
**Workflow:** Backlog → In progress → In review → Done

A task is Done once the implementation has passed checks, been reviewed, and merged into `main`.

## Milestones

| Milestone | Status | Outcome |
| --- | --- | --- |
| M0 — Project foundation | Done | React, TypeScript, Vite, Tailwind and docs |
| M1 — Camera preview | Done | Live video, permission/error handling, cleanup |
| V1 — Complete single-device photobooth | In progress | 4 shots, countdown, retake, templates, PNG export |
| M5 — Quality & polish | Backlog | Automated tests, accessibility, extra templates |
| Future — Dual-device mode | Later | 2 devices, connected sessions, 2×4 photo layout |

## Completed

- [x] Define single-device MVP and future dual-device requirements.
- [x] Scaffold React + TypeScript using Vite.
- [x] Initialize and connect GitHub repository.
- [x] Integrate Tailwind and clean starter UI — [PR #1](https://github.com/Nandoi/pictayo/pull/1).
- [x] Add architecture, tracker, and Git workflow — [PR #2](https://github.com/Nandoi/pictayo/pull/2).
- [x] Implement live camera preview — [PR #3](https://github.com/Nandoi/pictayo/pull/3).

## V1 — One release PR

- [ ] Automatic four-photo capture, each with a three-second countdown.
- [ ] Retake an individual frame from capture or review.
- [ ] Select from three fixed-size strip styles.
- [ ] Customize caption and toggle date.
- [ ] Export a complete 1200 × 3200 PNG photo strip.
- [ ] Verify permission denied, missing camera, retry, and camera shutdown.
- [ ] Manually test laptop and narrow mobile layout.
- [ ] Run `npm run lint` and `npm run build`.
- [ ] Open, review, and merge the single V1 PR.

## Acceptance checklist for the V1 PR

- [ ] No blank/black photos after countdown (test camera readiness).
- [ ] Four shots appear in the correct order.
- [ ] Retaking frame 2 changes only frame 2.
- [ ] Changing themes and caption updates both preview and download.
- [ ] PNG opens at exactly 1200 × 3200 pixels.
- [ ] Camera indicator stops on leaving the capture stage or closing the tab.
- [ ] Lint/build pass, no console errors.

## Future work

- Add real user-designed template assets and more layout options.
- Unit and browser tests, performance, accessibility, share flow.
- Dual-device sessions (signaling, synchronization, paired strip export).

## Session log

| Date | Work | Outcome |
| --- | --- | --- |
| 2026-10-30 | Planned PicTayo and initialized Git | React/Vite application created |
| 2026-10-30 | Merged PRs #1 and #2 | Tailwind, cleanup, documentation |
| 2026-10-30 | Merged PR #3 | Camera preview on `main` |
| 2026-10-30 | Started all-in-one V1 | Photo session, themes, PNG export prepared for one PR |
