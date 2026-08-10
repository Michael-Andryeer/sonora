import { describe, expect, it } from 'vitest';

import { MAX_CONCURRENCY, MP3_BITRATE_KBPS } from '../shared/constants';

// Bootstrap test that confirms the toolchain (TypeScript + Vitest) is wired up.
// Real unit tests for the core/ modules are added as those modules are built.
describe('shared constants', () => {
  it('processes more than one download at a time', () => {
    expect(MAX_CONCURRENCY).toBeGreaterThan(1);
  });

  it('targets 320 kbps MP3 output', () => {
    expect(MP3_BITRATE_KBPS).toBe(320);
  });
});
