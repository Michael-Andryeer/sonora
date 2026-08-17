import { spawn } from 'node:child_process';

import { MP3_BITRATE_KBPS } from '../../shared/constants';
import {
  CONVERT_PROGRESS_TEMPLATE,
  DOWNLOAD_PROGRESS_TEMPLATE,
  parseProgressLine,
  type ProgressEvent,
} from '../core/progress-parser';
import { denoPath, ffmpegPath, ytDlpPath } from './binary-manager';

export interface DownloadOptions {
  outDir: string;
  onProgress?: (event: ProgressEvent) => void;
}

export interface DownloadResult {
  url: string;
}

/** How many times to run yt-dlp before giving up on a transient failure. */
const MAX_ATTEMPTS = 3;

/**
 * YouTube's anti-bot layer throws intermittent 403s (and similar) that clear on
 * a fresh extraction. yt-dlp's own --retries reuses the same poisoned media URL,
 * so we re-run the whole process instead — which pulls fresh URLs and tokens.
 */
function isRetriable(message: string): boolean {
  return /HTTP Error 403|unable to download video data|HTTP Error 5\d\d|Got error|timed out|timeout|Connection reset|read, write|fragment .* not found/i.test(
    message,
  );
}

function buildArgs(url: string, outDir: string): string[] {
  const deno = denoPath();
  return [
    '-f',
    'bestaudio',
    '-x',
    '--audio-format',
    'mp3',
    '--audio-quality',
    `${MP3_BITRATE_KBPS}K`,
    '--embed-thumbnail',
    '--embed-metadata',
    '--no-playlist',
    '--newline',
    '--ffmpeg-location',
    ffmpegPath(),
    // Point yt-dlp at the bundled Deno so it can solve YouTube's JS challenge.
    ...(deno ? ['--js-runtimes', `deno:${deno}`] : []),
    '--progress-template',
    DOWNLOAD_PROGRESS_TEMPLATE,
    '--progress-template',
    CONVERT_PROGRESS_TEMPLATE,
    '-o',
    `${outDir}/%(title)s.%(ext)s`,
    url,
  ];
}

export async function download(url: string, options: DownloadOptions): Promise<DownloadResult> {
  let lastError: Error | undefined;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      return await runYtDlp(url, options);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt >= MAX_ATTEMPTS || !isRetriable(lastError.message)) {
        throw lastError;
      }
    }
  }
  throw lastError ?? new Error('yt-dlp failed');
}

function runYtDlp(url: string, options: DownloadOptions): Promise<DownloadResult> {
  return new Promise((resolve, reject) => {
    const proc = spawn(ytDlpPath(), buildArgs(url, options.outDir));

    let stdout = '';
    let stderr = '';

    proc.stdout?.on('data', (chunk) => {
      stdout += chunk.toString();
      const lines = stdout.split('\n');
      stdout = lines.pop() ?? '';
      for (const line of lines) {
        const event = parseProgressLine(line);
        if (event) options.onProgress?.(event);
      }
    });

    proc.stderr?.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    proc.on('error', reject);

    proc.on('close', (code) => {
      if (code === 0) {
        resolve({ url });
      } else {
        reject(new Error(stderr.trim() || `yt-dlp exited with code ${code}`));
      }
    });
  });
}
