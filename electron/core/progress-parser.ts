export interface ProgressEvent {
  phase: 'download' | 'convert';
  percent: number;
}

const PROGRESS = /^\[sonora:(download|convert)\]\s+([\d.]+)%/;

export const DOWNLOAD_PROGRESS_TEMPLATE = 'download:[sonora:download] %(progress._percent_str)s';

export const CONVERT_PROGRESS_TEMPLATE = 'postprocess:[sonora:convert] %(progress._percent_str)s';

export function parseProgressLine(line: string): ProgressEvent | null {
  const match = PROGRESS.exec(line);

  if (!match) return null;

  const phase = match[1] === 'convert' ? 'convert' : 'download';
  return { phase, percent: Number(match[2]) };
}
