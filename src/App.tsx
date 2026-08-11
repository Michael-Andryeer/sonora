import { useEffect, useState } from 'react';

import EqMark from '@/components/EqMark';
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

  const handleChooseFolder = () => {
    window.sonora
      .chooseOutputDir()
      .then((dir) => {
        if (dir) setOutputDir(dir);
      })
      .catch(() => {});
  };

  const hasCompleted = items.some((item) => item.status === 'done');

  return (
    <main className="flex min-h-screen flex-col items-center gap-7 px-6 py-10">
      <header className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-3">
          <EqMark className="h-7" />
          <h1 className="text-2xl font-bold uppercase tracking-[0.3em] text-cream">Sonora</h1>
        </div>
        <p className="text-sm text-taupe">
          Converta vídeos do YouTube em MP3, com capa e nome certinho
        </p>
      </header>

      <PasteBox onConvert={handleConvert} />

      {banner && <p className="text-sm text-alert">{banner}</p>}
      <div className="flex w-full max-w-xl items-center justify-between gap-4 text-xs">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={() => void window.sonora.openFolder()}
            title={outputDir}
            className="flex min-w-0 items-center gap-1.5 font-mono text-taupe transition hover:text-cream"
          >
            <span aria-hidden="true">📁</span>
            <span className="truncate">{outputDir || 'pasta de saída'}</span>
          </button>
          <button
            onClick={handleChooseFolder}
            className="shrink-0 text-taupe transition hover:text-cream"
          >
            Trocar
          </button>
        </div>
        {hasCompleted && (
          <button
            onClick={clearCompleted}
            className="shrink-0 text-taupe transition hover:text-cream"
          >
            Limpar concluídos
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-4 pt-6 text-center">
          <EqMark className="h-10 opacity-30" />
          <div className="max-w-sm">
            <p className="text-cream">Sua fila está vazia</p>
            <p className="mt-1 text-sm text-taupe">
              Cole um link acima e ele vira MP3 com capa e nome — pronto pro celular, o carro, onde
              for.
            </p>
          </div>
        </div>
      ) : (
        <QueueList items={items} onRetry={(id) => void window.sonora.retry(id)} />
      )}
    </main>
  );
}
