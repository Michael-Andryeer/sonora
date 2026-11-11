# Sonora

Desktop app that turns YouTube videos into **320 kbps MP3s**, with title, artist and cover art embedded.

Paste **one link**, **several links** (one per line) or a **playlist URL**. Sonora downloads and converts
everything, showing the progress of each track.

**[⬇ Download the latest release](https://github.com/Michael-Andryeer/sonora/releases/latest)** (Windows installer and Linux AppImage)

## Features

- Single videos, batches of links and whole playlists
- 320 kbps MP3 with embedded metadata and thumbnail as cover art
- Download queue with up to 3 tracks in parallel, to stay clear of YouTube rate limits
- Automatic retry on YouTube's transient 403/5xx errors, with a fresh extraction on every attempt
- Per-track progress (download and conversion phases) and one-click retry for failed items
- Configurable output folder (defaults to `Music/Sonora`)
- `yt-dlp`, `ffmpeg` and `deno` are bundled with the installer: nothing else to install

## Stack

- **Electron** + **electron-vite**, packaged with **electron-builder**
- **React** + **TypeScript** + **Tailwind** + **Zustand**
- A typed IPC contract shared by main and renderer, with **zod** validating renderer input
- **electron-store** for persisted settings
- **Vitest** for tests; ESLint, Prettier, Husky and commitlint on every commit

## Architecture

```
electron/
  core/       pure logic (queue, URL and progress parsing, file names, paths), unit-tested
  services/   side effects: yt-dlp/ffmpeg downloader, metadata, settings, bundled binaries
  ipc/        handlers that wire the renderer to the services
shared/       IPC contract and constants used by both processes
src/          React renderer (paste box, queue list, store)
```

## Development

```bash
npm install
npm run fetch:binaries   # downloads yt-dlp, ffmpeg and deno into resources/bin
npm run dev              # starts the app with hot reload
```

| Script | What it does |
| --- | --- |
| `npm run lint` | ESLint |
| `npm run format` / `format:check` | Prettier (write / check) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` / `test:watch` | Vitest (run / watch) |
| `npm run dist:win` / `dist:linux` | Builds the installer for each platform |

## Status

Target platforms: Windows and Linux. Spotify support and macOS are planned for future versions.
