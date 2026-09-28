# HTML to Figma

A web playground for HTML, CSS and JavaScript. Run your code, interact with the preview, then **Copy to Figma** and paste onto a Figma Design canvas.

## Run locally

Requires Node.js 20.19+ (or Node 22.12+) and Chrome/Edge.

```sh
npm install
npm run dev
```

Open **http://localhost:5173**. The same command starts an isolated preview server on **http://localhost:5174**. Both ports must be free.

1. Paste a full HTML document or fragment into the HTML tab; add separate CSS and JavaScript if needed.
2. Click **Run** (Cmd/Ctrl+Enter). Typing does not execute code.
3. Choose the viewport width and interact with your page to reach the state you want.
4. Click **Copy to Figma**. Keep the browser tab focused and permit clipboard access if requested.
5. Open a Figma **Design** file, click the canvas and press Cmd/Ctrl+V.

Changes must be Run before copying. Resizing preserves the current JavaScript state. Drafts are stored in localStorage; a restored draft requires Run before execution. Built-in examples can be selected from the dropdown and applied with Run.

## What the converter uses

The capture adapter loads Figma's runtime from `https://mcp.figma.com/mcp/html-to-design/capture.js` when Copy is clicked. It serializes the current rendered document into Figma's HTML clipboard format. The editor starts the real clipboard transaction in the user's click handler; a validated bridge delivers the payload from the preview. Success is shown after the clipboard write resolves, independently of Figma's toolbar lifecycle.

Before capture, a compatibility pass converts simple absolute-positioned, single-line Latin vertical labels into rotated editable text and plain ↗ glyphs into SVG vectors. Explicit emoji presentation is preserved. These temporary DOM changes are restored after serialization, failure or cancellation; source code is not rewritten. Unsupported complex vertical text is reported instead of silently flattened.

The studio example uses Lora and Inter web fonts for consistency with Figma. User-provided fonts are never automatically substituted or installed: common local/system fonts and failed web-font loads produce warnings. As [Figma's text documentation](https://developers.figma.com/docs/plugins/working-with-text/) explains, missing fonts can prevent editing even when text is visible. Font compatibility still requires checking the destination file.

The runtime is a third-party dependency, not a versioned SDK bundled into this app. It may change or become unavailable. Figma documents the related [Code to canvas workflow](https://developers.figma.com/docs/figma-mcp-server/code-to-canvas/) through its MCP server; this app's direct integration needs to be maintained separately. No Figma access token is stored by this app.

Source and drafts are handled in the browser. Capture, external images/fonts/scripts, and the editor's Google Fonts may make network requests; this is not an offline tool. Runtime Figma may proxy external assets. Use trusted source snippets; separate origins prevent preview JavaScript from reading editor DOM/localStorage, but are not protection against CPU-heavy or deliberately hostile browser code.

## Build and serve

```sh
npm run build
npm start
```

`npm start` serves the production build on the same two local ports. For a public deployment, serve `dist/` on **two different HTTPS origins**. Before building the editor, configure its preview origin:

```sh
VITE_PREVIEW_ORIGIN=https://preview.example.com npm run build
```

Serve `dist/index.html` at your editor origin and `dist/preview.html` plus its assets at the preview origin. Both may use the same `dist/` output. Configure the preview host to allow framing by the editor (`frame-ancestors`), and allow the editor to frame the preview (`frame-src`) if you set a Content Security Policy. Do not set `X-Frame-Options: SAMEORIGIN` on the preview. Serve the editor with clipboard-write allowed. Configure capture/runtime and required external asset sources in the preview's CSP. Preview and editor must not share an origin; the app refuses that configuration. Do not put accounts, sensitive cookies or other applications on the preview origin.

## Checks

```sh
npm test
npm run typecheck
npm run build
npx playwright install chromium
npm run test:e2e
```

Browser tests use an isolated Chromium context and **do write/read that test context's clipboard**. Capture tests use the real remote Figma runtime and need internet access. Unit tests exercise document assembly, bridge validation, draft storage, and clipboard success/error/cancellation contracts. E2E tests cover source execution, isolation, viewport changes, draft restore, runtime diagnostics, repeat capture, retry, narrow layout and a UI matrix (auth, dashboard, data table, commerce cards, interactive analytics and mobile).

The browser tests decode clipboard data and verify current text, viewport dimensions and compatibility adaptations. Separately, authenticated connected Chrome pasted the corrected sample into the user's Figma draft: a 1024 × 839 Auto Layout frame with a vertical label, vector arrows and Lora text that enters editing without a missing-font dialog. The original imperfect frame was kept alongside it. The live test used Figma's Edit → Paste over selection menu because the automation's Cmd+V did not dispatch native paste. See [validation evidence](docs/validation.md) for details and limitations.

## Current scope

- Plain browser HTML/CSS/JS; no JSX compilation, npm package installation, or repository import.
- External files need usable absolute URLs; local relative asset paths do not exist in this playground.
- Figma conversion fidelity depends on its runtime, available fonts and CSS support. Canvas/WebGL/media, complicated effects, Auto Layout and component reconstruction are not guaranteed.
- The vertical-text adapter covers single-line, absolutely positioned Latin labels with sideways orientation and no existing transform or padding/border. CJK, upright, multiline and flow-based vertical typography still need separate support. Arrow vectorization currently covers plain north-east arrows only; its stroke is an approximation, not an outline of the original font glyph. Arrows directly inside `display:contents` are left as text with a warning.
- JavaScript determines the captured appearance; app logic and interactions do not become Figma prototype logic.
- Capture errors retain your code. Runtime load errors can be retried; an interrupted serializer requires Run before retry because the third-party runtime exposes no cancellation API. Very large documents have a 32 MiB clipboard limit and a 35-second capture deadline.
