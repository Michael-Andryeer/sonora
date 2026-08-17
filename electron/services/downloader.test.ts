import { EventEmitter } from 'node:events';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { download } from './downloader';
import type { ProgressEvent } from '../core/progress-parser';

const { spawnMock, denoMock } = vi.hoisted(() => ({
  spawnMock: vi.fn(),
  denoMock: vi.fn(() => '/bin/deno' as string | null),
}));

vi.mock('node:child_process', () => ({ spawn: spawnMock }));
vi.mock('./binary-manager', () => ({
  ytDlpPath: () => '/bin/yt-dlp',
  ffmpegPath: () => '/bin/ffmpeg',
  denoPath: denoMock,
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

/** Let the retry loop advance past a rejected attempt and spawn the next one. */
function flush() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

beforeEach(() => {
  spawnMock.mockReset();
  denoMock.mockReset();
  denoMock.mockReturnValue('/bin/deno');
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
    expect(args).toContain('--js-runtimes');
    expect(args).toContain('deno:/bin/deno');
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

  it('omits --js-runtimes when no bundled deno is available', async () => {
    denoMock.mockReturnValue(null);
    const proc = fakeProcess();
    spawnMock.mockReturnValue(proc);

    const result = download('https://youtu.be/abcdefghijk', { outDir: '/music' });
    const [, args] = spawnMock.mock.calls[0] as [string, string[]];
    expect(args).not.toContain('--js-runtimes');

    proc.emit('close', 0);
    await expect(result).resolves.toEqual({ url: 'https://youtu.be/abcdefghijk' });
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

  it('retries after a transient 403 and then resolves', async () => {
    const proc1 = fakeProcess();
    const proc2 = fakeProcess();
    spawnMock.mockReturnValueOnce(proc1).mockReturnValueOnce(proc2);

    const result = download('https://youtu.be/abcdefghijk', { outDir: '/music' });

    proc1.stderr.emit(
      'data',
      Buffer.from('ERROR: unable to download video data: HTTP Error 403: Forbidden\n'),
    );
    proc1.emit('close', 1);

    await flush();
    proc2.emit('close', 0);

    await expect(result).resolves.toEqual({ url: 'https://youtu.be/abcdefghijk' });
    expect(spawnMock).toHaveBeenCalledTimes(2);
  });

  it('gives up after MAX_ATTEMPTS when the failure keeps repeating', async () => {
    spawnMock.mockImplementation(() => {
      const proc = fakeProcess();
      queueMicrotask(() => {
        proc.stderr.emit('data', Buffer.from('ERROR: unable to download video data: 403\n'));
        proc.emit('close', 1);
      });
      return proc;
    });

    await expect(download('https://youtu.be/abcdefghijk', { outDir: '/music' })).rejects.toThrow(
      /403/,
    );
    expect(spawnMock).toHaveBeenCalledTimes(3);
  });

  it('does not retry a non-transient error like an unavailable video', async () => {
    const proc = fakeProcess();
    spawnMock.mockReturnValue(proc);

    const result = download('https://youtu.be/abcdefghijk', { outDir: '/music' });
    proc.stderr.emit('data', Buffer.from('ERROR: Video unavailable\n'));
    proc.emit('close', 1);

    await expect(result).rejects.toThrow(/Video unavailable/);
    expect(spawnMock).toHaveBeenCalledTimes(1);
  });

  it('rejects when the process fails to start', async () => {
    const proc = fakeProcess();
    spawnMock.mockReturnValue(proc);

    const result = download('https://youtu.be/abcdefghijk', { outDir: '/music' });
    proc.emit('error', new Error('spawn ENOENT'));

    await expect(result).rejects.toThrow(/ENOENT/);
  });
});
