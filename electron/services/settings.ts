import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { app } from 'electron';
import Store from 'electron-store';

import { DEFAULT_OUTPUT_FOLDER } from '../../shared/constants';

interface SettingsSchema {
  outputDir?: string;
}

const store = new Store<SettingsSchema>();

function defaultOutputDir(): string {
  return join(app.getPath('music'), DEFAULT_OUTPUT_FOLDER);
}

/**
 * Create `dir` (and any missing parents) only when it isn't already there.
 *
 * A plain recursive mkdir would crash on a drive root such as `D:\`: Windows
 * reports EPERM (not EEXIST) for a root that already exists, and Node's
 * recursive mode only swallows EEXIST. Skipping mkdir when the folder exists
 * sidesteps that quirk; a genuinely unwritable target still surfaces its real
 * error later, when we actually write the file.
 */
function ensureDir(dir: string): void {
  if (existsSync(dir)) return;
  mkdirSync(dir, { recursive: true });
}

export function getOutputDir(): string {
  const dir = store.get('outputDir') ?? defaultOutputDir();
  ensureDir(dir);
  return dir;
}

export function setOutputDir(dir: string): void {
  store.set('outputDir', dir);
}
