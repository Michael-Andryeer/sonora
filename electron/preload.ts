import { contextBridge, ipcRenderer } from 'electron';

import { IpcChannel, type SonoraApi } from '../shared/ipc-contract';

const api: SonoraApi = {
  getAppInfo: () => ipcRenderer.invoke(IpcChannel.appInfo),
};

contextBridge.exposeInMainWorld('sonora', api);
