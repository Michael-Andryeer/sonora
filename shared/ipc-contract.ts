/**
 * IPC contract shared between the main process and the renderer.
 *
 * Channel names live in `IpcChannel`; the `SonoraApi` interface is the exact
 * surface exposed to the renderer through the preload bridge (`window.sonora`).
 */

export const IpcChannel = {
  appInfo: 'app:info',
  convert: 'convert',
  progress: 'convert:progress',
  done: 'convert:done',
  error: 'convert:error',
} as const;

export interface AppInfo {
  version: string;
  platform: NodeJS.Platform;
}

export interface ProgressPayload {
  url: string;
  phase: 'download' | 'convert';
  percent: number;
}

export interface DonePayload {
  url: string;
  outputDir: string;
}

export interface ErrorPayload {
  url: string;
  message: string;
}

/** The API surface exposed on `window.sonora` in the renderer. */
export interface SonoraApi {
  getAppInfo(): Promise<AppInfo>;
  convert(text: string): Promise<void>;
  onProgress(callback: (payload: ProgressPayload) => void): () => void;
  onDone(callback: (payload: DonePayload) => void): () => void;
  onError(callback: (payload: ErrorPayload) => void): () => void;
}
