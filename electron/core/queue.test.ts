import { describe, expect, it } from 'vitest';

import {
  createItems,
  isFinished,
  nextUp,
  retry,
  setActive,
  setDone,
  setError,
  setProgress,
} from './queue';

describe('createItems', () => {
  it('creates queued items from urls', () => {
    expect(createItems(['a', 'b'])).toEqual([
      { id: '0', url: 'a', status: 'queued', percent: 0 },
      { id: '1', url: 'b', status: 'queued', percent: 0 },
    ]);
  });
});

describe('nextUp', () => {
  it('returns queued items up to the concurrency limit', () => {
    const items = createItems(['a', 'b', 'c', 'd', 'e']);
    expect(nextUp(items, 3).map((item) => item.url)).toEqual(['a', 'b', 'c']);
  });

  it('accounts for already active items', () => {
    let items = createItems(['a', 'b', 'c', 'd']);
    items = setActive(items, '0');
    items = setActive(items, '1');
    expect(nextUp(items, 3).map((item) => item.url)).toEqual(['c']);
  });

  it('returns nothing when all slots are busy', () => {
    let items = createItems(['a', 'b', 'c', 'd']);
    items = setActive(setActive(setActive(items, '0'), '1'), '2');
    expect(nextUp(items, 3)).toEqual([]);
  });

  it('defaults to the shared concurrency (3)', () => {
    const items = createItems(['a', 'b', 'c', 'd']);
    expect(nextUp(items)).toHaveLength(3);
  });
});

describe('status transitions', () => {
  const base = createItems(['a', 'b']);

  it('marks an item active', () => {
    expect(setActive(base, '0')[0]?.status).toBe('active');
  });

  it('updates progress and keeps the item active', () => {
    expect(setProgress(base, '0', 42)[0]).toMatchObject({ status: 'active', percent: 42 });
  });

  it('marks an item done at 100 percent', () => {
    expect(setDone(base, '0')[0]).toMatchObject({ status: 'done', percent: 100 });
  });

  it('marks an item errored with a message', () => {
    expect(setError(base, '0', 'boom')[0]).toMatchObject({ status: 'error', error: 'boom' });
  });

  it('only changes the targeted item', () => {
    expect(setDone(base, '0')[1]).toEqual(base[1]);
  });

  it('does not mutate the original array', () => {
    setDone(base, '0');
    expect(base[0]?.status).toBe('queued');
  });
});

describe('retry', () => {
  it('resets an errored item back to queued', () => {
    let items = createItems(['a']);
    items = setError(items, '0', 'boom');
    const retried = retry(items, '0');
    expect(retried[0]).toMatchObject({ status: 'queued', percent: 0 });
    expect(retried[0]?.error).toBeUndefined();
  });
});

describe('isFinished', () => {
  it('is false while items are queued or active', () => {
    const items = setDone(createItems(['a', 'b']), '0');
    expect(isFinished(items)).toBe(false);
  });

  it('is true when every item is done or errored', () => {
    let items = createItems(['a', 'b']);
    items = setDone(items, '0');
    items = setError(items, '1', 'boom');
    expect(isFinished(items)).toBe(true);
  });
});
