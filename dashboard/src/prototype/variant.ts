/**
 * PROTOTYPE (issue #109), throwaway. Not for main.
 *
 * Three variants of the dashboard on small screens, switchable via
 * `?variant=` on the existing screens:
 *
 * - `0` today's `main`, as the baseline to compare against;
 * - `A` keeps the tables and drops columns by breakpoint;
 * - `B` turns lists into cards below 768 px and the detail into a sheet;
 * - `C` an inbox list below 1024 px, the detail as its own page, and a tab
 *   bar instead of the sidebar.
 */

import { useSyncExternalStore } from 'react';

export const VARIANTS = [
  { key: '0', name: 'Heute (main)' },
  { key: 'A', name: 'Tabelle mit Prioritätsspalten' },
  { key: 'B', name: 'Karten und Bottom Sheet' },
  { key: 'C', name: 'Posteingang, Detail als Seite' },
] as const;

export type VariantKey = (typeof VARIANTS)[number]['key'];

// Tests run against today's layout.
const DEFAULT_VARIANT: VariantKey = import.meta.env.MODE === 'test' ? '0' : 'A';
const CHANGE_EVENT = 'prototype-variant-change';

function read(): VariantKey {
  const value = new URLSearchParams(window.location.search).get('variant');
  const match = VARIANTS.find((variant) => variant.key === value);
  return match?.key ?? DEFAULT_VARIANT;
}

function subscribe(onChange: () => void) {
  window.addEventListener('popstate', onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener('popstate', onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

export function usePrototypeVariant(): VariantKey {
  return useSyncExternalStore(subscribe, read);
}

/** Replaces `?variant=` and keeps the `#screen` fragment the app routes on. */
export function setPrototypeVariant(key: VariantKey): void {
  const url = new URL(window.location.href);
  url.searchParams.set('variant', key);
  window.history.replaceState(null, '', url);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}
