# Open Screen Studio

A free, open-source screen recorder for macOS that automatically makes your recordings look polished. Think Screen Studio, but free and built for the community.

## Why this exists

Screen Studio is amazing but it costs $89. That's a lot if you're a developer, creator, or student who just wants clean demo videos without spending hours editing. So I built this. Record your screen, and the app automatically adds smooth zoom-ins on your clicks, nice backgrounds, rounded corners, and shadows. Then export to MP4 or GIF. That's it.

This is for builders who want to share their work without the price tag.

## What it does

- **Screen recording** with display selection (uses ScreenCaptureKit under the hood)
- **Auto-zoom on clicks** with smooth easing animations (configurable speed, zoom level, easing curve)
- **Styled backgrounds** with gradient presets, padding, rounded corners, and drop shadows
- **Mouse event tracking** so the app knows exactly where you clicked
- **Export to MP4 or GIF** at 720p, 1080p, or 4K via FFmpeg
- **Editor UI** with a timeline, click markers, live preview, and an effects panel

## Prerequisites

- macOS 13+ (Ventura or later)
- [Node.js](https://nodejs.org/) 18+
- [Rust](https://rustup.rs/)
- [FFmpeg](https://ffmpeg.org/) (needed for export)

Install FFmpeg with Homebrew if you don't have it:

```bash
brew install ffmpeg
```

Install Rust if you don't have it:

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

## Getting started

Clone the repo:

```bash
git clone git@github.com:ryan-yuuu/open-screen-studio.git
cd open-screen-studio
```

Install dependencies:

```bash
npm install
```

Run the app in dev mode:

```bash
npm run tauri dev
```

The first build takes a few minutes because it's compiling all the Rust dependencies. After that it's fast.

## Permissions

When you first run the app, macOS will ask for:

1. **Screen Recording** permission (needed to capture your screen)
2. **Accessibility** permission (needed to track mouse clicks for auto-zoom)

Go to System Settings > Privacy & Security to grant these if the prompts don't show up automatically.

## Tech stack

| Layer | Tech |
|-------|------|
| App framework | Tauri v2 |
| Frontend | React + TypeScript + Vite |
| Backend | Rust |
| Screen capture | ScreenCaptureKit (via macOS screencapture) |
| Video processing | FFmpeg |
| UI | Tailwind CSS + Radix UI |
| State | Zustand |

## Project structure

```
src/              # React frontend (components, hooks, stores)
src-tauri/src/    # Rust backend
  capture/        # Screen recording + mouse event tracking
  processing/     # Zoom engine, background rendering, compositor, encoder
  commands/       # Tauri IPC command handlers
  models/         # Shared data types
```

## Contributing

PRs and issues are welcome. If you have ideas for features or find bugs, open an issue and let's talk about it.

## License

MIT
