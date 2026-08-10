/// <reference types="vite/client" />

import type { SonoraApi } from '@shared/ipc-contract';

declare global {
  interface Window {
    sonora: SonoraApi;
  }
}
