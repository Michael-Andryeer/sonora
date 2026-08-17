import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { app } from 'electron';

type BinaryName = 'yt-dlp' | 'ffmpeg' | 'deno';

function platformDir(): string {
  return `${process.platform}-${process.arch}`;
}

function fileName(name: BinaryName): string {
  return process.platform === 'win32' ? `${name}.exe` : name;
}

function bundledDir(): string {
  const base = app.isPackaged ? process.resourcesPath : app.getAppPath();
  return join(base, 'resources', 'bin', platformDir());
}

export function resolveBinary(name: BinaryName): string {
  const bundled = join(bundledDir(), fileName(name));
  return existsSync(bundled) ? bundled : name;
}

export function ytDlpPath(): string {
  return resolveBinary('yt-dlp');
}

export function ffmpegPath(): string {
  return resolveBinary('ffmpeg');
}

/**
 * Path to the bundled Deno binary, or null when it isn't bundled.
 *
 * Returning null (instead of a bare name) lets the caller omit yt-dlp's
 * --js-runtimes flag entirely and fall back to yt-dlp's own auto-detection of a
 * system Deno, rather than pointing it at a path that doesn't exist.
 */
export function denoPath(): string | null {
  const bundled = join(bundledDir(), fileName('deno'));
  return existsSync(bundled) ? bundled : null;
}
