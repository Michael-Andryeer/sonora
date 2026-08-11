import type { QueueItemDto } from '@shared/ipc-contract';

interface QueueItemProps {
  item: QueueItemDto;
  onRetry: (id: string) => void;
}

function statusLabel(item: QueueItemDto): string {
  switch (item.status) {
    case 'queued':
      return 'na fila';
    case 'active':
      return `${item.phase === 'convert' ? 'convertendo' : 'baixando'} · ${Math.round(item.percent)}%`;
    case 'done':
      return 'pronto';
    case 'error':
      return item.error ?? 'erro';
  }
}

function meterColor(status: QueueItemDto['status']): string {
  if (status === 'error') return 'bg-alert';
  if (status === 'done') return 'bg-signal';
  return 'bg-glow shadow-glow';
}

export default function QueueItem({ item, onRetry }: QueueItemProps) {
  const isError = item.status === 'error';
  const width = item.status === 'done' ? 100 : item.percent;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-line bg-panel p-3">
      {item.thumbnail ? (
        <img src={item.thumbnail} alt="" className="h-11 w-11 shrink-0 rounded-md object-cover" />
      ) : (
        <div className="h-11 w-11 shrink-0 rounded-md bg-raised" />
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-cream">{item.title ?? item.url}</p>
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-raised">
          <div
            className={`h-full rounded-full transition-all duration-300 ${meterColor(item.status)}`}
            style={{ width: `${width}%` }}
          />
        </div>
        <p
          className={`mt-1.5 font-mono text-[11px] uppercase tracking-wider ${
            isError ? 'text-alert' : 'text-taupe'
          }`}
        >
          {statusLabel(item)}
        </p>
      </div>

      {isError && (
        <button
          onClick={() => onRetry(item.id)}
          className="shrink-0 rounded-md border border-line px-2.5 py-1 text-xs text-cream transition hover:border-glow hover:text-glow"
        >
          Tentar de novo
        </button>
      )}
    </div>
  );
}
