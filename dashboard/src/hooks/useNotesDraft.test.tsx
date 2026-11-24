import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { NOTES_DEBOUNCE_MS } from '@/domain/application';

import { useNotesDraft } from './useNotesDraft';

/**
 * The draft is the reason the notes field is not a controlled copy of the
 * cache, so these are tests about time and about failure: when the request is
 * sent, and what is on screen after it does not arrive.
 */
describe('useNotesDraft', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /** Advances past the debounce and lets the save's promise settle. */
  async function pause(ms = NOTES_DEBOUNCE_MS) {
    await act(async () => {
      vi.advanceTimersByTime(ms);
      await Promise.resolve();
    });
  }

  it('sends nothing until typing pauses', async () => {
    const save = vi.fn(() => Promise.resolve());
    const { result } = renderHook(() => useNotesDraft(save));

    act(() => {
      result.current.onChange('a1', 'Sch');
    });
    await pause(NOTES_DEBOUNCE_MS - 1);

    expect(save).not.toHaveBeenCalled();

    await pause(1);

    expect(save).toHaveBeenCalledExactlyOnceWith('a1', 'Sch');
  });

  /** The requirement `API.md` names: a burst is one request, not one per key. */
  it('sends one request for a burst of keystrokes', async () => {
    const save = vi.fn(() => Promise.resolve());
    const { result } = renderHook(() => useNotesDraft(save));

    for (const text of ['S', 'Sc', 'Sch']) {
      act(() => {
        result.current.onChange('a1', text);
      });
      await pause(100);
    }

    await pause();

    expect(save).toHaveBeenCalledExactlyOnceWith('a1', 'Sch');
  });

  it('shows the draft while it is unsent and lets go once it lands', async () => {
    const save = vi.fn(() => Promise.resolve());
    const { result } = renderHook(() => useNotesDraft(save));

    act(() => {
      result.current.onChange('a1', 'Rückruf');
    });

    expect(result.current.draft).toEqual({
      applicationId: 'a1',
      text: 'Rückruf',
    });

    await pause();

    expect(result.current.draft).toBeNull();
  });

  /**
   * The rule the Staff member notices: a note that did not save is still on
   * screen, where it can be read and copied out, rather than reverted to
   * whatever the server last accepted.
   */
  it('keeps the text when the save fails', async () => {
    const save = vi.fn(() => Promise.reject(new Error('offline')));
    const { result } = renderHook(() => useNotesDraft(save));

    act(() => {
      result.current.onChange('a1', 'Rückruf');
    });
    await pause();

    expect(save).toHaveBeenCalledOnce();
    expect(result.current.draft).toEqual({
      applicationId: 'a1',
      text: 'Rückruf',
    });
  });

  /** Text typed while the request was in flight is not thrown away by its success. */
  it('holds on to a keystroke that landed after the request left', async () => {
    const save = vi.fn(() => Promise.resolve());
    const { result } = renderHook(() => useNotesDraft(save));

    act(() => {
      result.current.onChange('a1', 'Rück');
    });
    await pause();
    act(() => {
      result.current.onChange('a1', 'Rückruf');
    });

    expect(result.current.draft?.text).toBe('Rückruf');
  });

  /**
   * One draft, because one drawer is open at a time — so opening another
   * Application's notes has to flush the first rather than drop it.
   */
  it('sends a pending note before starting one on another Application', () => {
    const save = vi.fn(() => Promise.resolve());
    const { result } = renderHook(() => useNotesDraft(save));

    act(() => {
      result.current.onChange('a1', 'Rückruf');
    });
    act(() => {
      result.current.onChange('a2', 'Warteliste');
    });

    expect(save).toHaveBeenCalledExactlyOnceWith('a1', 'Rückruf');
    expect(result.current.draft).toEqual({
      applicationId: 'a2',
      text: 'Warteliste',
    });
  });
});
