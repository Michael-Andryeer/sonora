import { EventEmitter } from 'node:events';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { download } from './downloader';
import type { ProgressEvent } from '../core/progress-parser';

const { spawnMock } = vi.hoisted(() => ({ spawnMock: vi.fn() }));

vi.mock('node:child_process', () => ({ spawn: spawnMock }));
vi.mock('./binary-manager', () => ({
  ytDlpPath: () => '/bin/yt-dlp',
  ffmpegPath: () => '/bin/ffmpeg',
}));

function fakeProcess() {
  const proc = new EventEmitter() as EventEmitter & {
    stdout: EventEmitter;
    stderr: EventEmitter;
  };
  proc.stdout = new EventEmitter();
  proc.stderr = new EventEmitter();
  return proc;
}

beforeEach(() => {
  spawnMock.mockReset();
});

describe('download', () => {
  it('spawns yt-dlp with the right arguments, reports progress and resolves', async () => {
    const proc = fakeProcess();
    spawnMock.mockReturnValue(proc);

    const events: ProgressEvent[] = [];
    const result = download('https://www.youtube.com/watch?v=abcdefghijk', {
      outDir: '/music',
      onProgress: (event) => events.push(event),
    });

    expect(spawnMock).toHaveBeenCalledTimes(1);
    const [bin, args] = spawnMock.mock.calls[0] as [string, string[]];
    expect(bin).toBe('/bin/yt-dlp');
    expect(args).toEqual(
      expect.arrayContaining([
        '-x',
        'mp3',
        '--embed-thumbnail',
        '--embed-metadata',
        '--no-playlist',
      ]),
    );
    expect(args).toContain('--ffmpeg-location');
    expect(args).toContain('/bin/ffmpeg');
    expect(args).toContain('https://www.youtube.com/watch?v=abcdefghijk');
    expect(args.some((arg) => arg.includes('/music') && arg.includes('%(title)s'))).toBe(true);

    proc.stdout.emit('data', Buffer.from('[sonora:download]  50.0%\n[sonora:convert] 100%\n'));
    proc.emit('close', 0);

    await expect(result).resolves.toEqual({ url: 'https://www.youtube.com/watch?v=abcdefghijk' });
    expect(events).toEqual([
      { phase: 'download', percent: 50 },
      { phase: 'convert', percent: 100 },
    ]);
  });

  it('reassembles progress lines split across chunks', async () => {
    const proc = fakeProcess();
    spawnMock.mockReturnValue(proc);

    const events: ProgressEvent[] = [];
    const result = download('https://youtu.be/abcdefghijk', {
      outDir: '/music',
      onProgress: (event) => events.push(event),
    });

    proc.stdout.emit('data', Buffer.from('[sonora:down'));
    proc.stdout.emit('data', Buffer.from('load]  25.0%\n'));
    proc.emit('close', 0);

    await result;
    expect(events).toEqual([{ phase: 'download', percent: 25 }]);
  });

  it('rejects with the yt-dlp error output on a non-zero exit', async () => {
    const proc = fakeProcess();
    spawnMock.mockReturnValue(proc);

    const result = download('https://youtu.be/abcdefghijk', { outDir: '/music' });
    proc.stderr.emit('data', Buffer.from('ERROR: Video unavailable\n'));
    proc.emit('close', 1);

    await expect(result).rejects.toThrow(/Video unavailable/);
  });

  it('rejects when the process fails to start', async () => {
    const proc = fakeProcess();
    spawnMock.mockReturnValue(proc);

    const result = download('https://youtu.be/abcdefghijk', { outDir: '/music' });
    proc.emit('error', new Error('spawn ENOENT'));

    await expect(result).rejects.toThrow(/ENOENT/);
  });
});
