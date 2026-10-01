# Pomodoro — Minimalist Electron Desktop App

A minimalist, floating Pomodoro timer built with Electron. Text-only UI, no images, no gradients, near-monochrome dark design.

## Features

- Pomodoro timer: 25min focus / 5min short break / 15min long break
- START / PAUSE, RESET, and SKIP controls
- Always-on-top pin toggle
- Frameless, fixed-size floating window (320×300)
- Clean dark interface with tabular numerals to prevent digit jitter

## Requirements

- Node.js (v22.12.0 or later)
- npm

## Setup

```bash
npm install
```

## Run

```bash
npm start
```

The window will appear on your desktop. Drag the title bar to move it, or click **PIN** to keep it always on top.

## Project Structure

```
.
├── main.js        # Electron main process — window creation, IPC handlers
├── preload.js     # Context bridge — exposes window.api to the renderer
├── index.html     # Renderer markup
├── style.css      # Styling (CSS custom properties, dark theme)
├── script.js      # Renderer logic — timer state, controls
├── package.json   # Electron entry point and scripts
└── package-lock.json
```

## Tech Stack

- Electron
- Vanilla HTML/CSS/JS (no frameworks, no bundler, no build step)
