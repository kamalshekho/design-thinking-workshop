/**
 * The width jsdom pretends to have, which the media-query stub in `setup.ts`
 * reads. Every test starts at `DESK_WIDTH`, wider than every breakpoint; a
 * test of a phone layout calls `setViewportWidth` before it renders.
 */

export const DESK_WIDTH = 1600;

export function setViewportWidth(width: number): void {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  });
}
