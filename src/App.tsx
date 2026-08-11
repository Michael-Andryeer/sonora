import { useEffect, useState } from 'react';

import PasteBox from '@/components/PasteBox';
import QueueList from '@/components/QueueList';
import { useQueue } from '@/stores/queue.store';

export default function App() {
  const { items, init, applyMeta, applyProgress, applyDone, applyError, clearCompleted } =
    useQueue();
  const [outputDir, setOutputDir] = useState('');
  const [banner, setBanner] = useState<string | null>(null);

  useEffect(() => {
    window.sonora
      .getOutputDir()
      .then(setOutputDir)
      .catch(() => {});
    const offInit = window.sonora.onQueueInit((list) => init(list));
    const offMeta = window.sonora.onMeta((p) => applyMeta(p.id, p.title, p.thumbnail));
    const offProgress = window.sonora.onProgress((p) => applyProgress(p.id, p.phase, p.percent));
    const offDone = window.sonora.onDone((p) => applyDone(p.id));
    const offError = window.sonora.onError((p) => applyError(p.id, p.message));
    return () => {
      offInit();
      offMeta();
      offProgress();
      offDone();
      offError();
    };
  }, [init, applyMeta, applyProgress, applyDone, applyError]);

  const handleConvert = (text: string) => {
    setBanner(null);
    window.sonora.convert(text).catch((error) => {
      setBanner(error instanceof Error ? error.message : String(error));
    });
  };

  const hasCompleted = items.some((item) => item.status === 'done');

  return (
    <main className="flex min-h-screen flex-col items-center gap-6 bg-neutral-950 p-8 text-neutral-100">
      <div className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Sonora</h1>
        <p className="text-sm text-neutral-500">YouTube → MP3</p>
      </div>

      <PasteBox onConvert={handleConvert} />

      {banner && <p className="text-sm text-red-400">{banner}</p>}

      <div className="flex w-full max-w-xl items-center justify-between gap-4 text-xs text-neutral-500">
        <button
          onClick={() => void window.sonora.openFolder()}
          title={outputDir}
          className="truncate hover:text-neutral-300"
        >
          📁 {outputDir || 'Pasta de saída'}
        </button>
        {hasCompleted && (
          <button onClick={clearCompleted} className="shrink-0 hover:text-neutral-300">
            Limpar concluídos
          </button>
        )}
      </div>

      <QueueList items={items} onRetry={(id) => void window.sonora.retry(id)} />
    </main>
  );
}
