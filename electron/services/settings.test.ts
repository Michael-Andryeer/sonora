import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getMock, setMock, mkdirMock, existsMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  setMock: vi.fn(),
  mkdirMock: vi.fn(),
  existsMock: vi.fn(),
}));

vi.mock('node:fs', () => ({ mkdirSync: mkdirMock, existsSync: existsMock }));
vi.mock('electron', () => ({ app: { getPath: () => '/home/user/Music' } }));
vi.mock('electron-store', () => ({
  default: class {
    get = getMock;
    set = setMock;
  },
}));

// Imported after the mocks so the module-level `new Store()` uses the mock.
const { getOutputDir } = await import('./settings');

beforeEach(() => {
  getMock.mockReset();
  setMock.mockReset();
  mkdirMock.mockReset();
  existsMock.mockReset();
});

describe('getOutputDir', () => {
  it('returns an existing drive-root folder without crashing (Windows EPERM quirk)', () => {
    // On Windows, mkdir on a drive root throws EPERM even though it exists.
    getMock.mockReturnValue('D:\\');
    existsMock.mockReturnValue(true);
    mkdirMock.mockImplementation(() => {
      throw Object.assign(new Error("EPERM: operation not permitted, mkdir 'D:\\'"), {
        code: 'EPERM',
      });
    });

    expect(getOutputDir()).toBe('D:\\');
    expect(mkdirMock).not.toHaveBeenCalled();
  });

  it('creates the output folder when it does not exist yet', () => {
    getMock.mockReturnValue('/music/Sonora');
    existsMock.mockReturnValue(false);

    expect(getOutputDir()).toBe('/music/Sonora');
    expect(mkdirMock).toHaveBeenCalledWith('/music/Sonora', { recursive: true });
  });
});
