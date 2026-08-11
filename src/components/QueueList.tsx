import QueueItem from '@/components/QueueItem';
import type { QueueItemDto } from '@shared/ipc-contract';

interface QueueListProps {
  items: QueueItemDto[];
  onRetry: (id: string) => void;
}

export default function QueueList({ items, onRetry }: QueueListProps) {
  if (items.length === 0) return null;

  return (
    <div className="flex w-full max-w-xl flex-col gap-2">
      {items.map((item) => (
        <QueueItem key={item.id} item={item} onRetry={onRetry} />
      ))}
    </div>
  );
}
