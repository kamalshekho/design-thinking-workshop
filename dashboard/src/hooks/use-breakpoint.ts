/**
 * Clone path: `hooks/use-breakpoint.ts`. Replaced `useState` + `useEffect`
 * with `useSyncExternalStore` subscribing to `window.matchMedia`.
 */

import { useCallback, useSyncExternalStore } from 'react';

const screens = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

const getServerSnapshot = () => true;

/**
 * Checks whether a particular Tailwind CSS viewport size applies.
 *
 * @param size The size to check, which must either be included in Tailwind CSS's
 * list of default screen sizes, or added to the Tailwind CSS config file.
 *
 * @returns A boolean indicating whether the viewport size applies.
 */
export const useBreakpoint = (size: 'sm' | 'md' | 'lg' | 'xl' | '2xl') => {
  const query = `(min-width: ${screens[size]})`;

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (typeof window === 'undefined') {
        return () => undefined;
      }

      const breakpoint = window.matchMedia(query);
      breakpoint.addEventListener('change', onStoreChange);

      return () => {
        breakpoint.removeEventListener('change', onStoreChange);
      };
    },
    [query],
  );

  const getSnapshot = useCallback(
    () =>
      typeof window !== 'undefined' ? window.matchMedia(query).matches : true,
    [query],
  );

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
};
