import '@testing-library/jest-dom/vitest';

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
 * jsdom implements no media queries. The copied account card asks for one to
 * decide where its menu opens; in tests every query reports no match, which is
 * the phone placement.
 */
if (typeof window.matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (query: string): MediaQueryList => ({
      matches: false,
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
