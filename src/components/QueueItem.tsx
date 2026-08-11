import type { QueueItemDto } from '@shared/ipc-contract';

interface QueueItemProps {
  item: QueueItemDto;
  onRetry: (id: string) => void;
}

function statusLabel(item: QueueItemDto): string {
  switch (item.status) {
    case 'queued':
      return 'Na fila';
    case 'active':
      return `${item.phase === 'convert' ? 'Convertendo' : 'Baixando'}… ${Math.round(item.percent)}%`;
    case 'done':
      return '✓ Pronto';
    case 'error':
      return item.error ?? 'Erro';
  }
}

export default function QueueItem({ item, onRetry }: QueueItemProps) {
  const isError = item.status === 'error';

  return (
    <div className="flex items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-900 p-3">
      {item.thumbnail ? (
        <img src={item.thumbnail} alt="" className="h-10 w-10 shrink-0 rounded object-cover" />
      ) : (
        <div className="h-10 w-10 shrink-0 rounded bg-neutral-800" />
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">{item.title ?? item.url}</p>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-neutral-800">
          <div
            className={`h-full transition-all ${isError ? 'bg-red-500' : 'bg-emerald-500'}`}
            style={{ width: `${item.status === 'done' ? 100 : item.percent}%` }}
          />
        </div>
        <p className={`mt-1 text-xs ${isError ? 'text-red-400' : 'text-neutral-500'}`}>
          {statusLabel(item)}
        </p>
      </div>

      {isError && (
        <button
          onClick={() => onRetry(item.id)}
          className="shrink-0 rounded-md border border-neutral-700 px-2 py-1 text-xs hover:bg-neutral-800"
        >
          Tentar de novo
        </button>
      )}
    </div>
  );
}
