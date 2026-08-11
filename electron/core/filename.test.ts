import { describe, expect, it } from 'vitest';

import { dedupeName, sanitizeFilename } from './filename';

describe('sanitizeFilename', () => {
  it('keeps a title that is already valid', () => {
    expect(sanitizeFilename('Artist - Song (Official Video)')).toBe(
      'Artist - Song (Official Video)',
    );
  });

  it('replaces filesystem-illegal characters with spaces', () => {
    expect(sanitizeFilename('AC/DC: Thunderstruck')).toBe('AC DC Thunderstruck');
    expect(sanitizeFilename('a<b>c|d')).toBe('a b c d');
  });

  it('trims whitespace and strips trailing dots', () => {
    expect(sanitizeFilename('  Hello World.  ')).toBe('Hello World');
  });

  it('falls back to "audio" when nothing usable remains', () => {
    expect(sanitizeFilename('***')).toBe('audio');
    expect(sanitizeFilename('   ')).toBe('audio');
  });

  it('truncates very long titles to 180 characters', () => {
    expect(sanitizeFilename('a'.repeat(200))).toHaveLength(180);
  });
});

describe('dedupeName', () => {
  it('returns the name unchanged when there is no collision', () => {
    expect(dedupeName('Song', new Set())).toBe('Song');
    expect(dedupeName('Song', new Set(['Other']))).toBe('Song');
  });

  it('appends a numeric suffix on collision', () => {
    expect(dedupeName('Song', new Set(['Song']))).toBe('Song (2)');
  });

  it('increments the suffix until it finds a free name', () => {
    expect(dedupeName('Song', new Set(['Song', 'Song (2)']))).toBe('Song (3)');
  });
});
