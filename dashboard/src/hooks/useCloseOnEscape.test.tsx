import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useCloseOnEscape } from './useCloseOnEscape';

function press(key: string, { answered = false } = {}) {
  const event = new KeyboardEvent('keydown', { key, cancelable: true });

  if (answered) {
    event.preventDefault();
  }

  document.dispatchEvent(event);
}

describe('useCloseOnEscape', () => {
  it('closes on Escape', () => {
    const onClose = vi.fn();

    renderHook(() => {
      useCloseOnEscape(onClose);
    });

    press('Escape');

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('leaves an Escape that something inside has already answered', () => {
    const onClose = vi.fn();

    renderHook(() => {
      useCloseOnEscape(onClose);
    });

    press('Escape', { answered: true });

    expect(onClose).not.toHaveBeenCalled();
  });

  it('ignores every other key', () => {
    const onClose = vi.fn();

    renderHook(() => {
      useCloseOnEscape(onClose);
    });

    press('Enter');

    expect(onClose).not.toHaveBeenCalled();
  });

  it('stops listening once unmounted', () => {
    const onClose = vi.fn();

    const { unmount } = renderHook(() => {
      useCloseOnEscape(onClose);
    });

    unmount();
    press('Escape');

    expect(onClose).not.toHaveBeenCalled();
  });
});
