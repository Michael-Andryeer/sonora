import { describe, expect, it } from 'vitest';

import { isDriveRoot } from './paths';

describe('isDriveRoot', () => {
  it('flags Windows drive roots', () => {
    expect(isDriveRoot('D:\\')).toBe(true);
    expect(isDriveRoot('C:\\')).toBe(true);
    expect(isDriveRoot('C:/')).toBe(true);
    expect(isDriveRoot('D:')).toBe(true);
    expect(isDriveRoot('  D:\\  ')).toBe(true);
  });

  it('flags the POSIX root', () => {
    expect(isDriveRoot('/')).toBe(true);
  });

  it('accepts real folders inside a drive', () => {
    expect(isDriveRoot('D:\\Sonora')).toBe(false);
    expect(isDriveRoot('C:\\Users\\ana\\Music')).toBe(false);
    expect(isDriveRoot('/home/ana/Music/Sonora')).toBe(false);
    expect(isDriveRoot('/media/usb')).toBe(false);
  });

  it('does not flag empty or relative paths', () => {
    expect(isDriveRoot('')).toBe(false);
    expect(isDriveRoot('   ')).toBe(false);
    expect(isDriveRoot('Sonora')).toBe(false);
  });
});
