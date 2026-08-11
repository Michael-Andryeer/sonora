import { describe, expect, it } from 'vitest';

import { parseInput } from './url-parser';

describe('parseInput', () => {
  describe('single video', () => {
    it('parses a standard watch URL', () => {
      const result = parseInput('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      expect(result).toEqual({
        kind: 'single',
        urls: ['https://www.youtube.com/watch?v=dQw4w9WgXcQ'],
      });
    });

    it('parses a youtu.be short URL and normalizes it', () => {
      const result = parseInput('https://youtu.be/dQw4w9WgXcQ');
      expect(result).toEqual({
        kind: 'single',
        urls: ['https://www.youtube.com/watch?v=dQw4w9WgXcQ'],
      });
    });

    it('accepts a URL without the www prefix', () => {
      const result = parseInput('https://youtube.com/watch?v=dQw4w9WgXcQ');
      expect(result.urls).toEqual(['https://www.youtube.com/watch?v=dQw4w9WgXcQ']);
    });

    it('strips extra query params (t, si) down to the canonical URL', () => {
      const result = parseInput('https://youtu.be/dQw4w9WgXcQ?si=abc123&t=42');
      expect(result).toEqual({
        kind: 'single',
        urls: ['https://www.youtube.com/watch?v=dQw4w9WgXcQ'],
      });
    });

    it('treats a video that also carries a list param as a single video', () => {
      const result = parseInput('https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLabc123');
      expect(result).toEqual({
        kind: 'single',
        urls: ['https://www.youtube.com/watch?v=dQw4w9WgXcQ'],
      });
    });
  });

  describe('multiple videos (list)', () => {
    it('parses several links, one per line', () => {
      const result = parseInput(
        ['https://www.youtube.com/watch?v=aaaaaaaaaaa', 'https://youtu.be/bbbbbbbbbbb'].join('\n'),
      );
      expect(result).toEqual({
        kind: 'list',
        urls: [
          'https://www.youtube.com/watch?v=aaaaaaaaaaa',
          'https://www.youtube.com/watch?v=bbbbbbbbbbb',
        ],
      });
    });

    it('preserves order and de-duplicates repeated videos', () => {
      const result = parseInput(
        [
          'https://www.youtube.com/watch?v=aaaaaaaaaaa',
          'https://youtu.be/bbbbbbbbbbb',
          'https://www.youtube.com/watch?v=aaaaaaaaaaa',
        ].join('\n'),
      );
      expect(result.kind).toBe('list');
      expect(result.urls).toEqual([
        'https://www.youtube.com/watch?v=aaaaaaaaaaa',
        'https://www.youtube.com/watch?v=bbbbbbbbbbb',
      ]);
    });

    it('collapses to a single video when duplicates reduce the count to one', () => {
      const result = parseInput(
        ['https://youtu.be/dQw4w9WgXcQ', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'].join('\n'),
      );
      expect(result.kind).toBe('single');
      expect(result.urls).toEqual(['https://www.youtube.com/watch?v=dQw4w9WgXcQ']);
    });
  });

  describe('playlist', () => {
    it('parses a playlist URL', () => {
      const result = parseInput('https://www.youtube.com/playlist?list=PLabc123');
      expect(result).toEqual({
        kind: 'playlist',
        urls: [],
        playlistUrl: 'https://www.youtube.com/playlist?list=PLabc123',
      });
    });

    it('takes the playlist even if plain videos are also pasted', () => {
      const result = parseInput(
        [
          'https://www.youtube.com/watch?v=aaaaaaaaaaa',
          'https://www.youtube.com/playlist?list=PLabc123',
        ].join('\n'),
      );
      expect(result.kind).toBe('playlist');
      expect(result.playlistUrl).toBe('https://www.youtube.com/playlist?list=PLabc123');
      expect(result.urls).toEqual([]);
    });
  });

  describe('noise and invalid input', () => {
    it('ignores blank lines and surrounding whitespace', () => {
      const result = parseInput('\n   https://youtu.be/dQw4w9WgXcQ  \n\n');
      expect(result).toEqual({
        kind: 'single',
        urls: ['https://www.youtube.com/watch?v=dQw4w9WgXcQ'],
      });
    });

    it('ignores lines that are not YouTube links', () => {
      const result = parseInput(
        ['not a link', 'https://example.com/song', 'https://youtu.be/dQw4w9WgXcQ'].join('\n'),
      );
      expect(result.urls).toEqual(['https://www.youtube.com/watch?v=dQw4w9WgXcQ']);
    });

    it('returns an empty list when nothing valid is found', () => {
      const result = parseInput('just some random text\nhttps://example.com');
      expect(result).toEqual({ kind: 'list', urls: [] });
    });
  });
});
