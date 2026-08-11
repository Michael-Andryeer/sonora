import { spawn } from 'node:child_process';

import { ytDlpPath } from './binary-manager';

function capture(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(ytDlpPath(), args);

    let stdout = '';
    let stderr = '';

    proc.stdout?.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    proc.stderr?.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    proc.on('error', reject);
    proc.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(stderr.trim() || `yt-dlp exited with code ${code}`));
      }
    });
  });
}

export async function expandPlaylist(url: string): Promise<string[]> {
  const output = await capture(['--flat-playlist', '--print', 'url', url]);
  return output
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export interface VideoMeta {
  title: string;
  thumbnail?: string;
}

export async function fetchMeta(url: string): Promise<VideoMeta> {
  const output = await capture(['--dump-json', '--no-playlist', url]);
  const data = JSON.parse(output) as { title?: string; thumbnail?: string };
  return {
    title: data.title ?? url,
    thumbnail: data.thumbnail,
  };
}
