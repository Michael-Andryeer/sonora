// Control chars are intentionally matched: they are illegal in filenames.
// eslint-disable-next-line no-control-regex
const ILLEGAL = /[<>:"/\\|?*\u0000-\u001f]/g;

export function sanitizeFilename(title: string): string {
  const cleaned = title
    .replace(ILLEGAL, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[. ]+$/, '');

  return cleaned.slice(0, 180) || 'audio';
}

export function dedupeName(name: string, taken: Set<string>): string {
  if (!taken.has(name)) return name;

  let n = 2;
  while (taken.has(`${name} (${n})`)) {
    n++;
  }
  return `${name} (${n})`;
}
