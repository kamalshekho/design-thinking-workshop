/**
 * Reads which screen the sidebar's `#fragment` links point at. `useSyncExternalStore`
 * over `window.location.hash` rather than an effect + `useState`, since the hash is
 * external state React does not own.
 */

import { useSyncExternalStore } from 'react';

import type { Screen } from './AppShell';

const IMPLEMENTED_SCREENS: readonly Screen[] = [
  'overview',
  'applications',
  'categories',
  'discarded',
];
const DEFAULT_SCREEN: Screen = 'applications';

function subscribe(onChange: () => void) {
  window.addEventListener('hashchange', onChange);
  return () => {
    window.removeEventListener('hashchange', onChange);
  };
}

function getSnapshot(): Screen {
  const hash = window.location.hash.slice(1).split('?')[0];
  const screen = IMPLEMENTED_SCREENS.find((candidate) => candidate === hash);
  return screen ?? DEFAULT_SCREEN;
}

export function useCurrentScreen(): Screen {
  return useSyncExternalStore(subscribe, getSnapshot);
}
