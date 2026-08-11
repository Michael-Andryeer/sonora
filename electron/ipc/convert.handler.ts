import { ipcMain } from 'electron';
import { z } from 'zod';

import { IpcChannel, type ProgressPayload } from '../../shared/ipc-contract';
import { parseInput } from '../core/url-parser';
import { download } from '../services/downloader';
import { getOutputDir } from '../services/settings';

const textSchema = z.string().min(1);

export function registerConvertHandler(): void {
  ipcMain.handle(IpcChannel.convert, async (event, rawText: unknown) => {
    const text = textSchema.parse(rawText);
    const parsed = parseInput(text);
    const url = parsed.urls[0];
    const sender = event.sender;

    if (!url) {
      sender.send(IpcChannel.error, { url: '', message: 'Nenhum link válido encontrado.' });
      return;
    }

    try {
      await download(url, {
        outDir: getOutputDir(),
        onProgress: (progress) => {
          const payload: ProgressPayload = {
            url,
            phase: progress.phase,
            percent: progress.percent,
          };
          sender.send(IpcChannel.progress, payload);
        },
      });
      sender.send(IpcChannel.done, { url });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      sender.send(IpcChannel.error, { url, message });
    }
  });
}
