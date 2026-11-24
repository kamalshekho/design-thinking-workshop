import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { useBreakpoint } from './use-breakpoint';

type Listener = (event: MediaQueryListEvent) => void;

function installControllableMatchMedia(initialWidth: number) {
  let width = initialWidth;
  const listenersByQuery = new Map<string, Set<Listener>>();

  const matchesFor = (query: string) => {
    const minWidth = /\(min-width:\s*(\d+)px\)/.exec(query)?.[1];
    return minWidth !== undefined && width >= Number(minWidth);
  };

  const originalDescriptor = Object.getOwnPropertyDescriptor(
    window,
    'matchMedia',
  );
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (query: string): MediaQueryList => {
      const listeners = listenersByQuery.get(query) ?? new Set<Listener>();
      listenersByQuery.set(query, listeners);

      return {
        get matches() {
          return matchesFor(query);
        },
        media: query,
        onchange: null,
        addEventListener: (
          _type: string,
          listener: EventListenerOrEventListenerObject,
        ) => {
          if (typeof listener === 'function') {
            listeners.add(listener);
          }
        },
        removeEventListener: (
          _type: string,
          listener: EventListenerOrEventListenerObject,
        ) => {
          if (typeof listener === 'function') {
            listeners.delete(listener);
          }
        },
        addListener: () => undefined,
        removeListener: () => undefined,
        dispatchEvent: () => false,
      };
    },
  });

  return {
    setWidth(nextWidth: number) {
      width = nextWidth;
      for (const [query, listeners] of listenersByQuery) {
        const event = {
          matches: matchesFor(query),
          media: query,
        } as MediaQueryListEvent;
        for (const listener of listeners) {
          listener(event);
        }
      }
    },
    restore() {
      if (originalDescriptor) {
        Object.defineProperty(window, 'matchMedia', originalDescriptor);
      }
    },
  };
}

describe('useBreakpoint', () => {
  let restoreMatchMedia: (() => void) | undefined;

  afterEach(() => {
    restoreMatchMedia?.();
    restoreMatchMedia = undefined;
  });

  it('returns the current matchMedia state and updates on change events and size prop changes', () => {
    const media = installControllableMatchMedia(800);
    restoreMatchMedia = () => {
      media.restore();
    };

    const initialProps: { size: 'sm' | 'md' | 'lg' | 'xl' | '2xl' } = {
      size: 'md',
    };
    const { result, rerender } = renderHook(
      ({ size }: { size: 'sm' | 'md' | 'lg' | 'xl' | '2xl' }) =>
        useBreakpoint(size),
      { initialProps },
    );

    expect(result.current).toBe(true);

    act(() => {
      media.setWidth(600);
    });
    expect(result.current).toBe(false);

    rerender({ size: 'sm' });
    expect(result.current).toBe(false);

    act(() => {
      media.setWidth(640);
    });
    expect(result.current).toBe(true);

    rerender({ size: 'lg' });
    expect(result.current).toBe(false);
  });
});
