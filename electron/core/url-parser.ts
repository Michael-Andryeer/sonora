export type InputKind = 'single' | 'list' | 'playlist';

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

function toUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}
function extractVideoId(line: string): string | null {
  const url = toUrl(line);
  if (!url) return null;

  const host = url.hostname.replace(/^www\./, '');
  let id: string | null = null;

  if (host === 'youtu.be') {
    id = url.pathname.slice(1); // /dQw4w9WgXcQ -> dQw4w9WgXcQ
  } else if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
    if (url.pathname === '/watch') {
      id = url.searchParams.get('v');
    }
  }

  return id && VIDEO_ID.test(id) ? id : null;
}

function extractPlaylistUrl(line: string): string | null {
  const url = toUrl(line);
  if (!url) return null;

  const host = url.hostname.replace(/^www\./, '');
  const isYouTube =
    host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com';
  const list = url.searchParams.get('list');

  if (isYouTube && url.pathname === '/playlist' && list) {
    return `https://www.youtube.com/playlist?list=${list}`;
  }
  return null;
}

function canonicalWatchUrl(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`;
}

export function parseInput(text: string): ParsedInput {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  let playlistUrl: string | undefined;
  const ids = new Set<string>();
  const urls: string[] = [];

  for (const line of lines) {
    const playlist = extractPlaylistUrl(line);
    if (playlist) {
      playlistUrl ??= playlist;
      continue;
    }
    const id = extractVideoId(line);
    if (id && !ids.has(id)) {
      ids.add(id);
      urls.push(canonicalWatchUrl(id));
    }
  }

  if (playlistUrl) {
    return { kind: 'playlist', urls: [], playlistUrl };
  }
  if (urls.length === 1) {
    return { kind: 'single', urls };
  }
  return { kind: 'list', urls };
}

export interface ParsedInput {
  kind: InputKind;
  urls: string[];
  playlistUrl?: string;
}
