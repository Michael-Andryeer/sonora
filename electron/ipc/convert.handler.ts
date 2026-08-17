import { join } from 'node:path';

import { dialog, ipcMain, shell, type WebContents } from 'electron';
import { z } from 'zod';

import { DEFAULT_OUTPUT_FOLDER } from '../../shared/constants';
import {
  IpcChannel,
  type MetaPayload,
  type ProgressPayload,
  type QueueItemDto,
} from '../../shared/ipc-contract';
import { isDriveRoot } from '../core/paths';
import {
  createItems,
  isFinished,
  nextUp,
  setActive,
  setDone,
  setError,
  setProgress,
  type QueueItem,
} from '../core/queue';
import { parseInput } from '../core/url-parser';
import { download } from '../services/downloader';
import { expandPlaylist, fetchMeta } from '../services/metadata';
import { getOutputDir, setOutputDir } from '../services/settings';

const textSchema = z.string().min(1);
const idSchema = z.string();

/** id -> url, so a failed item can be retried on demand. */
const jobs = new Map<string, string>();

function toDto(item: QueueItem): QueueItemDto {
  return { id: item.id, url: item.url, status: item.status, percent: item.percent };
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

const META_CONCURRENCY = 4;

async function prefetchMeta(items: QueueItem[], sender: WebContents): Promise<void> {
  let index = 0;

  const worker = async () => {
    while (index < items.length) {
      const item = items[index];
      index += 1;
      if (!item) break;
      try {
        const meta = await fetchMeta(item.url);
        sender.send(IpcChannel.meta, {
          id: item.id,
          title: meta.title,
          thumbnail: meta.thumbnail,
        } satisfies MetaPayload);
      } catch {
        // metadata is best-effort; ignore failures
      }
    }
  };

  const workers = Array.from({ length: Math.min(META_CONCURRENCY, items.length) }, worker);
  await Promise.all(workers);
}

function drive(initial: QueueItem[], sender: WebContents, outputDir: string): Promise<void> {
  return new Promise((resolve) => {
    let items = initial;

    const pump = () => {
      if (isFinished(items)) {
        resolve();
        return;
      }
      for (const { id, url } of nextUp(items)) {
        items = setActive(items, id);
        sender.send(IpcChannel.progress, {
          id,
          phase: 'download',
          percent: 0,
        } satisfies ProgressPayload);

        download(url, {
          outDir: outputDir,
          onProgress: (progress) => {
            items = setProgress(items, id, progress.percent);
            sender.send(IpcChannel.progress, {
              id,
              phase: progress.phase,
              percent: progress.percent,
            } satisfies ProgressPayload);
          },
        })
          .then(() => {
            items = setDone(items, id);
            sender.send(IpcChannel.done, { id });
          })
          .catch((error: unknown) => {
            items = setError(items, id, messageOf(error));
            sender.send(IpcChannel.error, { id, message: messageOf(error) });
          })
          .finally(pump);
      }
    };

    pump();
  });
}

export function registerConvertHandler(): void {
  ipcMain.handle(IpcChannel.outputDir, () => getOutputDir());
  ipcMain.handle(IpcChannel.openFolder, () => shell.openPath(getOutputDir()));

  ipcMain.handle(IpcChannel.chooseOutputDir, async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory'],
      defaultPath: getOutputDir(),
    });
    const [dir] = result.filePaths;
    if (result.canceled || !dir) {
      return null;
    }
    if (isDriveRoot(dir)) {
      await dialog.showMessageBox({
        type: 'warning',
        title: 'Pasta inválida',
        message: 'Escolha uma subpasta, não a raiz do drive.',
        detail: `Não é possível salvar direto na raiz de um drive (${dir}). Crie ou selecione uma subpasta, como ${join(dir, DEFAULT_OUTPUT_FOLDER)}.`,
        buttons: ['OK'],
      });
      return null;
    }
    setOutputDir(dir);
    return dir;
  });

  ipcMain.handle(IpcChannel.convert, async (event, rawText: unknown) => {
    const text = textSchema.parse(rawText);
    const parsed = parseInput(text);
    const sender = event.sender;

    const urls =
      parsed.kind === 'playlist' && parsed.playlistUrl
        ? await expandPlaylist(parsed.playlistUrl)
        : parsed.urls;

    if (urls.length === 0) {
      throw new Error('Nenhum link válido encontrado.');
    }

    const items = createItems(urls);
    jobs.clear();
    for (const item of items) {
      jobs.set(item.id, item.url);
    }

    sender.send(IpcChannel.queueInit, items.map(toDto));

    void prefetchMeta(items, sender);

    await drive(items, sender, getOutputDir());
  });

  ipcMain.handle(IpcChannel.retry, async (event, rawId: unknown) => {
    const id = idSchema.parse(rawId);
    const url = jobs.get(id);
    if (!url) return;

    const sender = event.sender;
    sender.send(IpcChannel.progress, {
      id,
      phase: 'download',
      percent: 0,
    } satisfies ProgressPayload);

    try {
      await download(url, {
        outDir: getOutputDir(),
        onProgress: (progress) => {
          sender.send(IpcChannel.progress, {
            id,
            phase: progress.phase,
            percent: progress.percent,
          } satisfies ProgressPayload);
        },
      });
      sender.send(IpcChannel.done, { id });
    } catch (error) {
      sender.send(IpcChannel.error, { id, message: messageOf(error) });
    }
  });
}
