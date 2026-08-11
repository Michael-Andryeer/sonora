import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { app } from 'electron';

type BinaryName = 'yt-dlp' | 'ffmpeg';

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
