# HTML to Figma Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** A local web editor that renders HTML/CSS/JS and copies the rendered state as Figma-compatible clipboard HTML.

**Architecture:** React editor on port 5173; isolated preview document on port 5174. A validated message bridge carries source into preview and captured HTML back to a user-initiated clipboard write in the editor. Figma capture is isolated behind an adapter; actual paste validation is reported separately.

**Tech Stack:** React, TypeScript, Vite, Vitest (Node 20 compatible release), Playwright.

**Spec:** `docs/superpowers/specs/2026-09-28-html-to-figma-design.md`

**Execution status:** Implementation, development/production checks and live Figma paste/text-editing acceptance finished. See `../progress.md` and `../../validation.md` for evidence and fidelity limitations.

## Global Constraints

- “Không yêu cầu người dùng mở plugin Figma để import.”
- “JavaScript chỉ chạy khi người dùng Run; không chạy lại theo mỗi phím gõ.”
- “Capture phải giữ trạng thái giao diện đang chạy, không render lại bản HTML ban đầu để xuất.”
- “Không tự đọc clipboard của người dùng, không tự ghi clipboard lúc tải trang hoặc lúc Run.”
- Preview has a different origin; same-origin configuration fails closed.
- No accounts, backend source storage, JSX transpilation or repository import in this version.

## Review Focus

- Full HTML with embedded scripts, CSS and literal closing-tag strings: preserve behavior (Task 1).
- Stale or forged preview messages: reject by source, origin, session and request (Tasks 1–2).
- Capture succeeds before Figma's toolbar promise resolves: report actual clipboard write (Task 2).
- User edits while preview shows an older version: indicate pending changes and prevent misleading export (Task 3).
- Denied clipboard, inaccessible images, capture timeout and repeat Run/Copy: useful errors, no stale success (Tasks 2–4).

## File Map

- `src/shared/protocol.ts`: message schemas and boundary validation.
- `src/preview/document.ts`: DOM-based document assembly with script-safe bootstrap and blob URLs.
- `src/preview/bootstrap.ts`: isolated preview bridge, resource readiness and Figma capture adapter.
- `src/preview/main.ts`: initial handshake and document replacement on the preview origin.
- `src/editor/capture.ts`: user-initiated deferred clipboard transaction, deadlines and errors.
- `src/editor/Preview.tsx`: preview session lifecycle and messages.
- `src/editor/storage.ts`, `src/examples.ts`: draft handling and examples.
- `src/App.tsx`, `src/styles.css`: editor and preview workspace.
- `scripts/serve.mjs`: start both origins, with production build mode.
- `tests/`: unit contracts and browser integration tests.

### Task 1: Isolated preview and document construction

**Interfaces:** `Source {html, css, js: string}`; `buildDocument(source, {session, parentOrigin}, bootstrapSource): {html, dispose}`; `acceptPreviewMessage(event, {source, origin, session}): PreviewMessage | null`.

- [ ] Add package/tool configuration and tests for document preservation, separate CSS/JS, invalid messages and sessions. Run `npm test`; expect failing missing implementations first.
- [ ] Implement the DOM builder, typed protocol, separate-origin preview handshake and minimal editor shell. Extra CSS/JS use blob URLs so literal closing tags survive.
- [ ] Run unit tests and a browser probe: HTML and JS render, parent DOM access fails, Run replaces the prior session. Expected: tests pass and the visible document reflects input.

### Task 2: Capture-to-clipboard proof

**Interfaces:** `startClipboardCapture(send, dependencies?): CaptureTransaction`; transaction exposes `requestId`, `receive(message)`, `cancel()`, `done: Promise<void>`; preview receives capture command and emits matching payload/error messages.

- [ ] Add failing tests for clipboard denial, stale request IDs, duplicate payloads, timeout and HTML MIME data written before completion is reported.
- [ ] Implement synchronous user-gesture clipboard initiation with a deferred HTML Blob. In preview, load the unmodified Figma runtime on demand, intercept only the requested clipboard write, relay its HTML payload, and acknowledge the real parent write. Preserve current DOM and bounded resource wait.
- [ ] Run tests plus the real Figma runtime browser probe on a sample whose text was changed by JS. Expected: clipboard contains Figma HTML payload with the updated text. Do not claim editable-layer verification until real paste is checked.

### Task 3: Editor workspace

**Interfaces:** `Preview` accepts a versioned `Source` and viewport width; exposes `copy()`; reports loading/ready/copying/copied/error and runtime diagnostics. Draft storage validates all three source fields and handles unavailable localStorage.

- [ ] Add meaningful tests for corrupt drafts and browser flows (Run vs typing, state after interaction, viewport, repeat capture).
- [ ] Build a polished two-pane workspace: HTML/CSS/JS editor, example picker, Run, viewport presets/custom width, Copy to Figma, draft status and useful diagnostics. Use a simple code editor with syntax highlighting and line numbers. Mark unrun edits and disable Copy until applied.
- [ ] Run browser tests and inspect desktop/narrow screenshots. Expected: no blocked actions, inaccessible controls, clipped toolbar or false copy success.

### Task 4: Verify and hand off

- [ ] Run `npm test`, `npm run typecheck`, `npm run build`, `npm run test:e2e`; inspect output.
- [ ] Review the whole implementation, resolve material findings and rerun affected checks.
- [ ] Document `npm install`, `npm run dev`, two-origin production configuration, current dependency and conversion limits in README.
- [ ] Record exact browser and clipboard evidence. If Figma authentication/file access is absent, leave paste validation explicitly pending and provide the running app for the user's own test.

## Execution Notes

- User approved the design and asked to continue; execute inline without a second approval loop.
- Workspace began with only the design document and no Git repository. Work directly in this new project; there are no existing branch changes to isolate or commits to preserve.
- Browser plugin bootstrap failed (`privileged native pipe bridge is not available`). Use standalone Playwright for local testing.
