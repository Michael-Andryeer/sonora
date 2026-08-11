import { describe, expect, it } from 'vitest';

import {
  CONVERT_PROGRESS_TEMPLATE,
  DOWNLOAD_PROGRESS_TEMPLATE,
  parseProgressLine,
} from './progress-parser';

describe('parseProgressLine', () => {
  it('parses a download progress line', () => {
    expect(parseProgressLine('[sonora:download]  42.3%')).toEqual({
      phase: 'download',
      percent: 42.3,
    });
  });

  it('parses a completed download line', () => {
    expect(parseProgressLine('[sonora:download] 100%')).toEqual({
      phase: 'download',
      percent: 100,
    });
  });

  it('parses a convert progress line', () => {
    expect(parseProgressLine('[sonora:convert]  50.0%')).toEqual({
      phase: 'convert',
      percent: 50,
    });
  });

  it('ignores yt-dlp default lines and other noise', () => {
    expect(parseProgressLine('[download]  42.3% of 3.50MiB at 1.2MiB/s')).toBeNull();
    expect(parseProgressLine('some random log line')).toBeNull();
    expect(parseProgressLine('')).toBeNull();
  });

  it('ignores non-numeric percentages', () => {
    expect(parseProgressLine('[sonora:download] N/A%')).toBeNull();
  });
});

describe('progress templates', () => {
  it('carry the sentinels the parser recognizes', () => {
    expect(DOWNLOAD_PROGRESS_TEMPLATE).toContain('[sonora:download]');
    expect(CONVERT_PROGRESS_TEMPLATE).toContain('[sonora:convert]');
  });
});
