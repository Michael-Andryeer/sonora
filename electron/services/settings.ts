import { mkdirSync } from 'node:fs';
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

export function getOutputDir(): string {
  const dir = store.get('outputDir') ?? defaultOutputDir();
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function setOutputDir(dir: string): void {
  store.set('outputDir', dir);
}
