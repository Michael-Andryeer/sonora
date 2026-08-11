import { create } from 'zustand';

type Status = 'idle' | 'downloading' | 'converting' | 'done' | 'error';

interface QueueState {
  status: Status;
  percent: number;
  error: string | null;
  outputDir: string | null;
  start: () => void;
  setProgress: (phase: 'download' | 'convert', percent: number) => void;
  setDone: (outputDir: string) => void;
  setError: (message: string) => void;
}

export const useQueue = create<QueueState>((set) => ({
  status: 'idle',
  percent: 0,
  error: null,
  outputDir: null,
  start: () => set({ status: 'downloading', percent: 0, error: null, outputDir: null }),
  setProgress: (phase, percent) =>
    set({ status: phase === 'download' ? 'downloading' : 'converting', percent }),
  setDone: (outputDir) => set({ status: 'done', percent: 100, outputDir }),
  setError: (message) => set({ status: 'error', error: message }),
}));
