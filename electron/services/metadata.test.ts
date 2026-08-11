import { EventEmitter } from 'node:events';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { expandPlaylist, fetchMeta } from './metadata';

const { spawnMock } = vi.hoisted(() => ({ spawnMock: vi.fn() }));

vi.mock('node:child_process', () => ({ spawn: spawnMock }));
vi.mock('./binary-manager', () => ({ ytDlpPath: () => '/bin/yt-dlp' }));

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

describe('expandPlaylist', () => {
  it('lists the video urls of a playlist', async () => {
    const proc = fakeProcess();
    spawnMock.mockReturnValue(proc);

    const result = expandPlaylist('https://www.youtube.com/playlist?list=PL1');
    const [, args] = spawnMock.mock.calls[0] as [string, string[]];
    expect(args).toContain('--flat-playlist');
    expect(args).toContain('https://www.youtube.com/playlist?list=PL1');

    proc.stdout.emit('data', Buffer.from('https://youtu.be/a\nhttps://youtu.be/b\n'));
    proc.emit('close', 0);

    await expect(result).resolves.toEqual(['https://youtu.be/a', 'https://youtu.be/b']);
  });

  it('rejects on a non-zero exit', async () => {
    const proc = fakeProcess();
    spawnMock.mockReturnValue(proc);

    const result = expandPlaylist('bad');
    proc.stderr.emit('data', Buffer.from('ERROR: nope\n'));
    proc.emit('close', 1);

    await expect(result).rejects.toThrow(/nope/);
  });
});

describe('fetchMeta', () => {
  it('parses the title and thumbnail from json', async () => {
    const proc = fakeProcess();
    spawnMock.mockReturnValue(proc);

    const result = fetchMeta('https://youtu.be/a');
    proc.stdout.emit(
      'data',
      Buffer.from(JSON.stringify({ title: 'Song', thumbnail: 'http://img/thumb.jpg' })),
    );
    proc.emit('close', 0);

    await expect(result).resolves.toEqual({ title: 'Song', thumbnail: 'http://img/thumb.jpg' });
  });

  it('falls back to the url when the title is missing', async () => {
    const proc = fakeProcess();
    spawnMock.mockReturnValue(proc);

    const result = fetchMeta('https://youtu.be/a');
    proc.stdout.emit('data', Buffer.from(JSON.stringify({})));
    proc.emit('close', 0);

    await expect(result).resolves.toMatchObject({ title: 'https://youtu.be/a' });
  });
});
