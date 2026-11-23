import '@testing-library/jest-dom/vitest';

import { DESK_WIDTH, setViewportWidth } from './viewport';

/**
 * jsdom implements no `ResizeObserver`, which Recharts' `ResponsiveContainer`
 * behind the sparklines observes its box with.
 */

class ResizeObserverMock {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

if (!('ResizeObserver' in globalThis)) {
  Object.defineProperty(globalThis, 'ResizeObserver', {
    configurable: true,
    writable: true,
    value: ResizeObserverMock,
  });
}

/**
 * jsdom implements no pointer-capture APIs, which Radix's `Select` calls
 * during its pointer-down handling, and no `scrollIntoView`, which it calls
 * when it scrolls the active option into view on open.
 */
Element.prototype.hasPointerCapture = (): boolean => false;
Element.prototype.setPointerCapture = (): void => undefined;
Element.prototype.releasePointerCapture = (): void => undefined;
Element.prototype.scrollIntoView = (): void => undefined;

/**
 * jsdom implements no media queries. This one answers `min-width` queries
 * against `window.innerWidth`, which a test starts at 1600 px, wider than every
 * breakpoint, so a screen renders its desk layout. A test of the phone layout
 * sets `window.innerWidth` before it renders (`setViewportWidth`). Any other
 * query reports no match.
 */
setViewportWidth(DESK_WIDTH);
afterEach(() => {
  setViewportWidth(DESK_WIDTH);
});

function matchesQuery(query: string): boolean {
  const minWidth = /\(min-width:\s*(\d+)px\)/.exec(query)?.[1];
  return minWidth !== undefined && window.innerWidth >= Number(minWidth);
}

if (typeof window.matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (query: string): MediaQueryList => ({
      matches: matchesQuery(query),
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }),
  });
}
