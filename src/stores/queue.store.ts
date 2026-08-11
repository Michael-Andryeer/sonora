import { create } from 'zustand';

import type { QueueItemDto } from '@shared/ipc-contract';

function patch(items: QueueItemDto[], id: string, changes: Partial<QueueItemDto>): QueueItemDto[] {
  return items.map((item) => (item.id === id ? { ...item, ...changes } : item));
}

interface QueueState {
  items: QueueItemDto[];
  init: (items: QueueItemDto[]) => void;
  applyMeta: (id: string, title: string, thumbnail?: string) => void;
  applyProgress: (id: string, phase: 'download' | 'convert', percent: number) => void;
  applyDone: (id: string) => void;
  applyError: (id: string, message: string) => void;
  clearCompleted: () => void;
}

export const useQueue = create<QueueState>((set) => ({
  items: [],
  init: (items) => set({ items }),
  applyMeta: (id, title, thumbnail) =>
    set((state) => ({ items: patch(state.items, id, { title, thumbnail }) })),
  applyProgress: (id, phase, percent) =>
    set((state) => ({ items: patch(state.items, id, { status: 'active', phase, percent }) })),
  applyDone: (id) =>
    set((state) => ({ items: patch(state.items, id, { status: 'done', percent: 100 }) })),
  applyError: (id, message) =>
    set((state) => ({ items: patch(state.items, id, { status: 'error', error: message }) })),
  clearCompleted: () =>
    set((state) => ({ items: state.items.filter((item) => item.status !== 'done') })),
}));
