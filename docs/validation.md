# Validation — 2026-09-28

## Verified

- `npm test`: 13 tests pass across 6 files.
- `npm run typecheck`: passes.
- `npm run build`: passes; editor bundle warning at 827 kB raw / 279 kB gzip.
- Original baseline: 5 browser tests passed against both development and minified production builds. Fidelity follow-up results are recorded below.
- `npm audit --omit=dev`: 0 vulnerabilities.
- Actual Figma capture runtime loaded from its remote endpoint; clipboard MIME is `text/html`. Decoded Figma payload retains JavaScript-updated text and reports width 1024, then 390 on a second capture without reloading the document.
- Runtime load failure surfaces an error, then retry succeeds.
- Full HTML input plus separate CSS/JS renders; source edits require Run; restored drafts do not execute automatically.
- Cross-origin preview cannot read the editor DOM. Bridge rejects wrong origin, source, session and malformed messages.
- Regression for interrupted capture A followed by retry B and late failure of A: fails before fix, passes after fix. Interrupted serializers require Run; preview cannot use native clipboard APIs.
- Desktop 1440 × 1000 and narrow 390 × 844 screenshots inspected. Workspace has no page-level horizontal overflow on narrow viewport.
- Connected Chrome (outside the isolated test browser) successfully clicked Copy to Figma on the production app and received the confirmed clipboard-success state.

## Live Figma acceptance

After the user signed in and opened a blank draft, connected Chrome successfully pasted the production app's clipboard into [the test frame](https://www.figma.com/design/XZT9OJkDcjZPGmKM2CWOxt/Untitled?node-id=2-2).

- The resulting Document frame is 1024 × 834 with vertical Auto Layout, separate text layers and SVG vector/group layers. The sample layout and vase illustration are present.
- Actual text editing verified: replaced missing Georgia with Inter on the selected headline only, changed its content to “Editable text verified”, and observed the changed text layer. Undid the test edits and verified the original headline and Georgia were restored.
- Original fonts need to be available in Figma, or replaced before editing. This browser session reported missing Georgia.
- Visual fidelity is not exact: the CSS vertical-writing label became horizontal and overflowed the right edge; arrow characters rendered as emoji-style icons.
- Automation's simulated Cmd+V produced key events but no native paste event. Acceptance used Figma Main menu → Edit → Paste over selection, consuming the same clipboard HTML without a plugin. Physical keyboard Cmd/Ctrl+V was not independently verified by automation.
- The pasted frame was visually inspected using a connected-browser screenshot. The original isolated headless session was blocked by CloudFront 403; this acceptance used authenticated connected Chrome.

## Fidelity correction follow-up

- Added a reversible pre-capture compatibility adapter. The studio's single-line Latin vertical label is emitted as rotated editable text; plain ↗ glyphs become SVG paths rather than emoji. Original source and adapted DOM text/style are restored, including on interrupted capture. Original text-node identity and click handlers are covered by tests.
- Studio font choice intentionally changed from local Georgia/Arial to web-loaded Lora/Inter. This is a sample change, not a general solution for arbitrary missing fonts. User font declarations remain unchanged; common local/system fonts and failed web-font loads produce diagnostics.
- New [corrected frame](https://www.figma.com/design/XZT9OJkDcjZPGmKM2CWOxt/Untitled?node-id=2-116), named **HTML → Figma · corrected**, pasted beside the preserved original. Frame is 1024 × 839. Browser screenshot confirms vertical label and thin vector arrows; headline typography shows Lora Regular 60 px and enters text editing without a replacement-font dialog.
- New tests first reproduced the original vertical-writing and sample-font failures. Additional tests reproduced silent failed-web-font fallback, direct body-arrow omission, margin double-offset (11 px), and flex/grid anonymous-item splitting (15.56 px), then passed after fixes.
- Final verification: 13 unit tests, TypeScript, production build and all 11 browser tests pass. The 827 kB editor bundle warning remains non-fatal.
- Independent review's two Important layout findings were reproduced and corrected. Its display:contents limitation now has an explicit warning. Exact original-font arrow outlines and complex vertical typography remain documented limitations; no whole-interface rasterization was introduced.

## Multi-interface test matrix

- Automated capture acceptance now covers six distinct interface shapes, all through the real remote Figma runtime and decoded HTML clipboard payload: an authentication form, a SaaS dashboard with an SVG line chart, an invoice table, a commerce product grid, an analytics page after a JavaScript interaction, and a 390 px mobile finance screen. Every payload retained its marker text, child-layer structure and intended 1024 px or 390 px viewport. See tests/e2e/ui-matrix.spec.ts.
- Direct Figma visual/layer acceptance added three representative frames to the user's draft: [SaaS dashboard](https://www.figma.com/design/XZT9OJkDcjZPGmKM2CWOxt/Untitled?node-id=2-233), [invoice table](https://www.figma.com/design/XZT9OJkDcjZPGmKM2CWOxt/Untitled?node-id=2-394), and [mobile finance](https://www.figma.com/design/XZT9OJkDcjZPGmKM2CWOxt/Untitled?node-id=2-576). They are named UI test · SaaS dashboard, UI test · Invoice table, and UI test · Mobile finance.
- In connected Chrome screenshots, the dashboard retained its sidebar/grid/cards and editable-vector chart appearance; the table retained columns, rows, chips and avatars; the mobile screen retained its 390 × 760 frame, cards, transaction rows and bottom navigation. These frames were not flattened into screenshots.
- The auth, commerce and interactive-analytics variants have passed capture-payload acceptance, but were not additionally pasted into the shared Figma draft to avoid clutter. Their direct-Figma visual fidelity remains unverified.
- A source snippet that falls back to a local font can emit a font diagnostic even if its primary font is shared. In the ad-hoc dashboard source, buttons used the browser's Arial default because the snippet did not set font: inherit; that diagnostic is accurate for that element, not caused by the hidden capture toolbar. Use an explicit shared font on controls when fidelity matters.

## Running handoff

`npm start` is serving the production build at http://localhost:5173, with the isolated preview on http://localhost:5174. If the process has stopped, run `npm start` again. For development with live updates use `npm run dev` instead, after stopping the production process.
