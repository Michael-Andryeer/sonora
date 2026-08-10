import { useEffect, useState } from 'react';

import type { AppInfo } from '@shared/ipc-contract';

export default function App() {
  const [info, setInfo] = useState<AppInfo | null>(null);

  useEffect(() => {
    window.sonora.getAppInfo().then(setInfo).catch(console.error);
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-2 bg-neutral-950 text-neutral-100">
      <h1 className="text-4xl font-semibold tracking-tight">Sonora</h1>
      <p className="text-neutral-400">YouTube → MP3</p>
      {info && (
        <p className="mt-2 text-xs text-neutral-600">
          v{info.version} · {info.platform}
        </p>
      )}
    </main>
  );
}
