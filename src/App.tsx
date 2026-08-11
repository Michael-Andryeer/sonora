import { useEffect } from 'react';

import PasteBox from '@/components/PasteBox';
import { useQueue } from '@/stores/queue.store';

export default function App() {
  const { status, percent, error, outputDir, start, setProgress, setDone, setError } = useQueue();

  useEffect(() => {
    const offProgress = window.sonora.onProgress((p) => setProgress(p.phase, p.percent));
    const offDone = window.sonora.onDone((p) => setDone(p.outputDir));
    const offError = window.sonora.onError((e) => setError(e.message));
    return () => {
      offProgress();
      offDone();
      offError();
    };
  }, [setProgress, setDone, setError]);

  const handleConvert = (text: string) => {
    start();
    window.sonora.convert(text).catch((e) => setError(String(e)));
  };

  const busy = status === 'downloading' || status === 'converting';

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-neutral-950 p-8 text-neutral-100">
      <div className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Sonora</h1>
        <p className="text-sm text-neutral-500">YouTube → MP3</p>
      </div>

      <PasteBox onConvert={handleConvert} disabled={busy} />

      {status !== 'idle' && (
        <div className="w-full max-w-xl">
          {busy && (
            <>
              <div className="mb-1 text-sm text-neutral-400">
                {status === 'downloading' ? 'Baixando' : 'Convertendo'}… {Math.round(percent)}%
              </div>
              <div className="h-2 w-full bg-neutral-800">
                <div className="h-full " style={{ width: `${percent}%` }} />
              </div>
            </>
          )}
          {status === 'done' && (
            <div className="text-sm text-emerald-400">
              <p>✓ Pronto! Música salva em:</p>
              <p className="mt-1 break-all font-mono text-xs text-neutral-400">{outputDir}</p>
            </div>
          )}
          {status === 'error' && <p className="text-sm text-red-400">Erro: {error}</p>}
        </div>
      )}
    </main>
  );
}
