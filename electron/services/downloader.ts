import { spawn } from 'node:child_process';

import { MP3_BITRATE_KBPS } from '../../shared/constants';
import {
  CONVERT_PROGRESS_TEMPLATE,
  DOWNLOAD_PROGRESS_TEMPLATE,
  parseProgressLine,
  type ProgressEvent,
} from '../core/progress-parser';
import { ffmpegPath, ytDlpPath } from './binary-manager';

export interface DownloadOptions {
  outDir: string;
  onProgress?: (event: ProgressEvent) => void;
}

export interface DownloadResult {
  url: string;
}

function buildArgs(url: string, outDir: string): string[] {
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
    '--progress-template',
    DOWNLOAD_PROGRESS_TEMPLATE,
    '--progress-template',
    CONVERT_PROGRESS_TEMPLATE,
    '-o',
    `${outDir}/%(title)s.%(ext)s`,
    url,
  ];
}

export function download(url: string, options: DownloadOptions): Promise<DownloadResult> {
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
