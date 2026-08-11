import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';

import {
  IpcChannel,
  type DonePayload,
  type ErrorPayload,
  type MetaPayload,
  type ProgressPayload,
  type QueueItemDto,
  type SonoraApi,
} from '../shared/ipc-contract';

function subscribe<T>(channel: string, callback: (payload: T) => void): () => void {
  const listener = (_event: IpcRendererEvent, payload: T) => callback(payload);
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.removeListener(channel, listener);
}

const api: SonoraApi = {
  getAppInfo: () => ipcRenderer.invoke(IpcChannel.appInfo),
  getOutputDir: () => ipcRenderer.invoke(IpcChannel.outputDir),
  chooseOutputDir: () => ipcRenderer.invoke(IpcChannel.chooseOutputDir),
  openFolder: () => ipcRenderer.invoke(IpcChannel.openFolder),
  convert: (text) => ipcRenderer.invoke(IpcChannel.convert, text),
  retry: (id) => ipcRenderer.invoke(IpcChannel.retry, id),
  onQueueInit: (callback) => subscribe<QueueItemDto[]>(IpcChannel.queueInit, callback),
  onMeta: (callback) => subscribe<MetaPayload>(IpcChannel.meta, callback),
  onProgress: (callback) => subscribe<ProgressPayload>(IpcChannel.progress, callback),
  onDone: (callback) => subscribe<DonePayload>(IpcChannel.done, callback),
  onError: (callback) => subscribe<ErrorPayload>(IpcChannel.error, callback),
};

contextBridge.exposeInMainWorld('sonora', api);
