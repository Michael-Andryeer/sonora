import { MAX_CONCURRENCY } from '../../shared/constants';

export type ItemStatus = 'queued' | 'active' | 'done' | 'error';

export interface QueueItem {
  id: string;
  url: string;
  title?: string;
  status: ItemStatus;
  percent: number;
  error?: string;
}

function update(items: QueueItem[], id: string, patch: Partial<QueueItem>): QueueItem[] {
  return items.map((item) => (item.id === id ? { ...item, ...patch } : item));
}

function activeCount(items: QueueItem[]): number {
  return items.filter((item) => item.status === 'active').length;
}

export function createItems(urls: string[]): QueueItem[] {
  return urls.map((url, index) => ({
    id: String(index),
    url,
    status: 'queued',
    percent: 0,
  }));
}

export function nextUp(items: QueueItem[], concurrency = MAX_CONCURRENCY): QueueItem[] {
  const slots = concurrency - activeCount(items);
  if (slots <= 0) return [];
  return items.filter((item) => item.status === 'queued').slice(0, slots);
}

export function setActive(items: QueueItem[], id: string): QueueItem[] {
  return update(items, id, { status: 'active' });
}

export function setProgress(items: QueueItem[], id: string, percent: number): QueueItem[] {
  return update(items, id, { status: 'active', percent });
}

export function setDone(items: QueueItem[], id: string): QueueItem[] {
  return update(items, id, { status: 'done', percent: 100 });
}

export function setError(items: QueueItem[], id: string, error: string): QueueItem[] {
  return update(items, id, { status: 'error', error });
}

export function retry(items: QueueItem[], id: string): QueueItem[] {
  return update(items, id, { status: 'queued', percent: 0, error: undefined });
}

export function isFinished(items: QueueItem[]): boolean {
  return items.every((item) => item.status === 'done' || item.status === 'error');
}
