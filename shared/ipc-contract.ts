/**
 * IPC contract shared between the main process and the renderer.
 *
 * Channel names live in `IpcChannel`; the `SonoraApi` interface is the exact
 * surface exposed to the renderer through the preload bridge (`window.sonora`).
 * This file grows as features are added (convert, retry, progress, ...).
 */

export const IpcChannel = {
  /** Renderer asks the main process for basic app info (version, platform). */
  appInfo: 'app:info',
} as const;

export interface AppInfo {
  version: string;
  platform: NodeJS.Platform;
}

/** The API surface exposed on `window.sonora` in the renderer. */
export interface SonoraApi {
  getAppInfo(): Promise<AppInfo>;
}
