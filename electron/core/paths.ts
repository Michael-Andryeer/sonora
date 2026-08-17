import { posix, win32 } from 'node:path';

/** True when `p` parses to a bare root with no final path segment. */
function isRootOnly(parser: typeof win32 | typeof posix, p: string): boolean {
  const parsed = parser.parse(p);
  return parsed.root !== '' && parsed.base === '';
}

/**
 * True when `dir` is a filesystem root that can't hold files directly — a
 * Windows drive root (`C:\`, `D:`, `C:/`) or a POSIX root (`/`).
 *
 * Both parsers are consulted so detection is host-independent: the app runs on
 * Windows and Linux, but should reject either flavour of root wherever it runs.
 * Saving output there is a dead end — see the EPERM mkdir quirk in settings.ts.
 */
export function isDriveRoot(dir: string): boolean {
  const p = dir.trim();
  if (p === '') return false;
  return isRootOnly(win32, p) || isRootOnly(posix, p);
}
