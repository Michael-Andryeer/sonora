import { execFileSync } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { chmod, copyFile, mkdir, mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const YT_DLP = {
  linux: {
    url: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux',
    out: 'yt-dlp',
  },
  win32: {
    url: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe',
    out: 'yt-dlp.exe',
  },
};

const FFMPEG = {
  linux: {
    url: 'https://github.com/yt-dlp/FFmpeg-Builds/releases/latest/download/ffmpeg-master-latest-linux64-gpl.tar.xz',
    out: 'ffmpeg',
  },
  win32: {
    url: 'https://github.com/yt-dlp/FFmpeg-Builds/releases/latest/download/ffmpeg-master-latest-win64-gpl.zip',
    out: 'ffmpeg.exe',
  },
};

async function download(url, dest) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok || !res.body) {
    throw new Error(`Download failed (${res.status}): ${url}`);
  }
  await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));
}

async function extractFfmpeg(archive, workDir, dest, platform) {
  if (platform === 'win32') {
    execFileSync('powershell', [
      '-NoProfile',
      '-Command',
      `Expand-Archive -Path '${archive}' -DestinationPath '${workDir}' -Force`,
    ]);
    const entries = await readdir(workDir, { withFileTypes: true });
    const folder = entries.find((e) => e.isDirectory() && e.name.startsWith('ffmpeg'));
    if (!folder) throw new Error('ffmpeg folder not found in archive');
    await copyFile(join(workDir, folder.name, 'bin', 'ffmpeg.exe'), dest);
  } else {
    execFileSync('tar', [
      'xJf',
      archive,
      '-C',
      workDir,
      '--strip-components=2',
      '--wildcards',
      '*/bin/ffmpeg',
    ]);
    await copyFile(join(workDir, 'ffmpeg'), dest);
  }
}

async function main() {
  const platform = process.platform;
  const arch = process.arch;

  if (!YT_DLP[platform] || !FFMPEG[platform]) {
    throw new Error(`Unsupported platform: ${platform}`);
  }

  const destDir = join(root, 'resources', 'bin', `${platform}-${arch}`);
  await mkdir(destDir, { recursive: true });

  const ytDlp = YT_DLP[platform];
  const ytDlpDest = join(destDir, ytDlp.out);
  console.log(`Downloading yt-dlp -> ${ytDlpDest}`);
  await download(ytDlp.url, ytDlpDest);
  if (platform !== 'win32') await chmod(ytDlpDest, 0o755);

  const ffmpeg = FFMPEG[platform];
  const ffmpegDest = join(destDir, ffmpeg.out);
  const work = await mkdtemp(join(tmpdir(), 'sonora-ffmpeg-'));
  try {
    console.log('Downloading ffmpeg archive...');
    const archive = join(work, platform === 'win32' ? 'ffmpeg.zip' : 'ffmpeg.tar.xz');
    await download(ffmpeg.url, archive);
    console.log(`Extracting ffmpeg -> ${ffmpegDest}`);
    await extractFfmpeg(archive, work, ffmpegDest, platform);
    if (platform !== 'win32') await chmod(ffmpegDest, 0o755);
  } finally {
    await rm(work, { recursive: true, force: true });
  }

  console.log(`Done. Binaries ready in ${destDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
