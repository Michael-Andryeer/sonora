/**
 * IPC contract shared between the main process and the renderer.
 *
 * Channel names live in `IpcChannel`; the `SonoraApi` interface is the exact
 * surface exposed to the renderer through the preload bridge (`window.sonora`).
 */

export const IpcChannel = {
  appInfo: 'app:info',
  outputDir: 'output-dir',
  openFolder: 'folder:open',
  convert: 'convert',
  retry: 'retry',
  queueInit: 'queue:init',
  meta: 'queue:meta',
  progress: 'queue:progress',
  done: 'queue:done',
  error: 'queue:error',
} as const;

export interface AppInfo {
  version: string;
  platform: NodeJS.Platform;
}

export type ItemStatus = 'queued' | 'active' | 'done' | 'error';

export interface QueueItemDto {
  id: string;
  url: string;
  status: ItemStatus;
  percent: number;
  phase?: 'download' | 'convert';
  title?: string;
  thumbnail?: string;
  error?: string;
}

export interface MetaPayload {
  id: string;
  title: string;
  thumbnail?: string;
}

export interface ProgressPayload {
  id: string;
  phase: 'download' | 'convert';
  percent: number;
}

export interface DonePayload {
  id: string;
}

export interface ErrorPayload {
  id: string;
  message: string;
}

/** The API surface exposed on `window.sonora` in the renderer. */
export interface SonoraApi {
  getAppInfo(): Promise<AppInfo>;
  getOutputDir(): Promise<string>;
  openFolder(): Promise<void>;
  convert(text: string): Promise<void>;
  retry(id: string): Promise<void>;
  onQueueInit(callback: (items: QueueItemDto[]) => void): () => void;
  onMeta(callback: (payload: MetaPayload) => void): () => void;
  onProgress(callback: (payload: ProgressPayload) => void): () => void;
  onDone(callback: (payload: DonePayload) => void): () => void;
  onError(callback: (payload: ErrorPayload) => void): () => void;
}
