import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';

import {
  IpcChannel,
  type DonePayload,
  type ErrorPayload,
  type ProgressPayload,
  type SonoraApi,
} from '../shared/ipc-contract';

function subscribe<T>(channel: string, callback: (payload: T) => void): () => void {
  const listener = (_event: IpcRendererEvent, payload: T) => callback(payload);
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.removeListener(channel, listener);
}

const api: SonoraApi = {
  getAppInfo: () => ipcRenderer.invoke(IpcChannel.appInfo),
  convert: (text) => ipcRenderer.invoke(IpcChannel.convert, text),
  onProgress: (callback) => subscribe<ProgressPayload>(IpcChannel.progress, callback),
  onDone: (callback) => subscribe<DonePayload>(IpcChannel.done, callback),
  onError: (callback) => subscribe<ErrorPayload>(IpcChannel.error, callback),
};

contextBridge.exposeInMainWorld('sonora', api);
