import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { fetchCategories } from './api';
import { useCategories } from './useCategories';

vi.mock('./api', () => ({ fetchCategories: vi.fn() }));

const mockFetchCategories = vi.mocked(fetchCategories);

/** A promise plus the callbacks to settle it on demand, from outside. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

describe('useCategories', () => {
  it('keeps the newer result when an older, superseded request resolves later', async () => {
    const first = deferred<Awaited<ReturnType<typeof fetchCategories>>>();
    const second = deferred<Awaited<ReturnType<typeof fetchCategories>>>();
    mockFetchCategories
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);

    const { result } = renderHook(() => useCategories());
    expect(mockFetchCategories).toHaveBeenCalledTimes(1);
    const [firstCall] = mockFetchCategories.mock.calls;
    const firstSignal = firstCall?.[0];
    expect(firstSignal).toBeInstanceOf(AbortSignal);

    act(() => {
      result.current.retry();
    });
    expect(mockFetchCategories).toHaveBeenCalledTimes(2);
    expect(firstSignal?.aborted).toBe(true);

    // The newer (retry) request settles first...
    await act(async () => {
      second.resolve({
        status: 'success',
        categories: [{ id: 'fresh', label: 'Fresh' }],
      });
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(result.current).toMatchObject({
        status: 'loaded',
        categories: [{ id: 'fresh', label: 'Fresh' }],
      });
    });

    // ...and the older, superseded request settles afterwards, with data that
    // must never win — this is exactly what the abort/staleness guard in
    // useCategories.ts exists to prevent.
    await act(async () => {
      first.resolve({
        status: 'success',
        categories: [{ id: 'stale', label: 'Stale' }],
      });
      await Promise.resolve();
    });
    expect(result.current).toMatchObject({
      status: 'loaded',
      categories: [{ id: 'fresh', label: 'Fresh' }],
    });
  });

  it('keeps the newer result when an older, superseded request fails later', async () => {
    const first = deferred<Awaited<ReturnType<typeof fetchCategories>>>();
    const second = deferred<Awaited<ReturnType<typeof fetchCategories>>>();
    mockFetchCategories
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);

    const { result } = renderHook(() => useCategories());
    act(() => {
      result.current.retry();
    });

    await act(async () => {
      second.resolve({
        status: 'success',
        categories: [{ id: 'fresh', label: 'Fresh' }],
      });
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(result.current.status).toBe('loaded');
    });

    // The stale request failing must not flip an already-correct, loaded
    // state back to an error.
    await act(async () => {
      first.resolve({ status: 'failed' });
      await Promise.resolve();
    });
    expect(result.current).toMatchObject({
      status: 'loaded',
      categories: [{ id: 'fresh', label: 'Fresh' }],
    });
  });
});
