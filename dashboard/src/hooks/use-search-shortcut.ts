/**
 * Focuses a search input on ⌘K / Ctrl+K.
 *
 * `SearchField` renders the ⌘K hint unconditionally, so every screen that
 * mounts one owes the reader the shortcut behind it — a key cap that does
 * nothing is worse than no key cap. This hook is that behaviour, shared by
 * Anfragen's toolbar and Kategorien rather than written twice.
 */

import type { RefObject } from 'react';
import { useEffect } from 'react';

export function useSearchShortcut(
  inputRef: RefObject<HTMLInputElement | null>,
): void {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      const isShortcut =
        (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k';
      if (isShortcut) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [inputRef]);
}
