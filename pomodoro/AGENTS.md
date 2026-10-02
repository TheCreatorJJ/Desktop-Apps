# AGENTS.md

Floating Pomodoro widget — Electron, no build step. ~6 files, all hand-written.

## Commands

```bash
npm start   # electron .  — the only script
```

No build, bundler, dev server, HMR, linter, formatter, typecheck, or tests exist.
"Reloading" means quit and relaunch. Renderer changes are picked up via `loadFile`, not a watcher.

Verify changes with `node --check main.js preload.js script.js` (renderer JS is plain browser JS,
so it parses standalone). The app is verified by launching `npm start` and looking at the window —
there is no automated check.

## Dependency trap (do not run `npm ci` / `npm install`)

`package.json` declares **no** dependencies, but `package-lock.json` records
`electron@^43.4.1` as a devDependency. `npm ci --dry-run` reports it would
**remove electron and 12 transitive packages**, silently breaking `npm start`.

If deps must be reinstalled, first add to `package.json`:

```json
"devDependencies": { "electron": "^43.4.1" }
```

(`package.json` name is `electron-app`; the lockfile root says `my-electron-app` — harmless, but
`npm ci` also compares these.)

## Architecture

| File | Process | Notes |
| --- | --- | --- |
| `main.js` | main | `BrowserWindow` 320x300, `frame: false`, `contextIsolation: true`, loads `index.html` |
| `preload.js` | preload | `contextBridge` → exposes `window.api` (2 methods, below) |
| `index.html` + `style.css` + `script.js` | renderer | plain `<script src>`, **not** `type="module"`, so `script.js` runs in global scope |

### IPC — the full contract

`contextIsolation` is on, so the renderer can reach nothing except `window.api`. Both channels are
registered at module scope in `main.js` (deliberately **outside** `createWindow`, so they don't
duplicate if the window is recreated):

| Renderer call | Main handler | Returns |
| --- | --- | --- |
| `window.api.closeApp()` | `ipcMain.on("close-app")` | — |
| `window.api.toggleAlwaysOnTop()` | `ipcMain.handle("toggle-always-on-top")` | new boolean state |

Any new capability crossing the boundary needs a `preload.js` entry **and** an `ipcMain` handler.
`invoke`/`handle` (returns a value) is preferred over `send`/`on` when the UI needs to reflect state.

### Window dragging

`frame: false` means drag must be declared in CSS: `.app` sets
`-webkit-app-region: drag` and every `button` sets `-webkit-app-region: no-drag`.
`.app` also sets `user-select: none` so dragging doesn't select the timer text.
**Any new element that must be clickable needs `no-drag`** — buttons are covered by the blanket
`button` rule, but a clickable `<div>` or `<svg>` will silently swallow clicks.

## Design constraints

Minimalist, near-monochrome, text-only. Preserve these unless the task says otherwise:

- **No images, no inline SVG, no icon buttons, no emoji, no gradients, no box-shadows.** The SVG
  progress ring, robot mascot, faux dock and titlebar pin/gear icons were all removed on purpose.
- **Palette is CSS custom properties in `:root`** — `--bg`, `--ink`, `--ink-dim`, `--ink-mute`,
  `--ink-faint`, `--ink-ghost`, `--line`, `--line-soft`, `--accent`. The UI is dark-first
  (no `prefers-color-scheme` block at present). Never hardcode a colour; use a variable.
  The outer border is a very low-contrast `--line`; the header rule is `--line-soft`.
- **One accent only** (`--accent`), reserved for "running" state, `PIN` when active, and
  `:focus-visible` outlines. It must stay desaturated.
- **Typography does the work.** Hierarchy comes from size/weight/letter-spacing and whitespace,
  not containers. Mode and session labels use wide `letter-spacing` plus a matching `text-indent`
  — the indent compensates for the trailing letter-space so the text optically centres.
  `--sans` is for the timer; `--mono` is for every label, the brand, and all controls.
- **Fonts are local only.** A Google Fonts `@import` was removed; `--font` is a system stack led by
  `"Segoe UI Variable Display"` / `"Segoe UI"`. Do not reintroduce a network font.
- **Transitions are `120ms ease` on `color` only.** Nothing scales, fades in, or animates on load.
  The one exception is the progress hairline: `width 1s linear` is what makes it drain smoothly.
- `.time` uses `font-variant-numeric: tabular-nums` + `"tnum"` so digits don't jitter each tick —
  keep both if the font size changes.

## Layout constraints

Window is fixed at 300x260, non-resizable, and `body { overflow: hidden }`, so overflow is
silently clipped — not scrollable. `.stage` is `flex: 1` with centered content, which absorbs
slack automatically; keep the timer inside `.stage` so it stays optically centred at any height.

The 8px outer margin is `body { padding: 8px }`, **not** `margin` on `.app`. Using `margin` makes
`.app`'s `height: 100%` overflow the viewport by exactly the margin and clips its own bottom border.

## Known non-functional / missing behaviour

- `main.js` has no `app.on("activate")`: on macOS, closing the window leaves a running process with
  no way to reopen it.
- Completing a session only stops the timer — no auto-advance to the next mode, no notification,
  no sound. `completed` increments and the "Session NN" label updates, but nothing else happens.
- The timer is not persisted; state resets to `focus` / 25:00 on every launch.

## Values duplicated across files (keep in sync)

- **Session lengths** — `DURATIONS` in `script.js:1`. The old `data-mins` attributes on
  `.mode-btn` were removed with the buttons, so this is now the single source of truth.
- **Mode order** — `ORDER` in `script.js:3` drives `SKIP`. `LABELS` must have a key per entry.
- `main.js` `backgroundColor` should track `:root --bg`; it's the only colour duplicated outside CSS.

## Style split (nothing enforces this)

- `main.js` / `preload.js`: 2-space indent, double quotes, CommonJS `require`.
- `script.js`: 2-space indent, single quotes, ES2015+ arrow functions and template literals.

Match the file you are editing.