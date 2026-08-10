import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { app, BrowserWindow, ipcMain } from 'electron';

import { IpcChannel, type AppInfo } from '../shared/ipc-contract';

const currentDir = dirname(fileURLToPath(import.meta.url));

function createWindow(): void {
  const window = new BrowserWindow({
    width: 900,
    height: 640,
    show: false,
    backgroundColor: '#0a0a0a',
    webPreferences: {
      preload: join(currentDir, '../preload/index.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  window.once('ready-to-show', () => window.show());

  const devServerUrl = process.env['ELECTRON_RENDERER_URL'];
  if (devServerUrl) {
    void window.loadURL(devServerUrl);
  } else {
    void window.loadFile(join(currentDir, '../renderer/index.html'));
  }
}

ipcMain.handle(IpcChannel.appInfo, (): AppInfo => {
  return { version: app.getVersion(), platform: process.platform };
});

void app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
