import { useEffect } from 'react';

/**
 * Closes a panel on Escape wherever focus sits, unless something inside it
 * has already answered that Escape: `OwnerSelect` closes its own popover with
 * it, and one key press should dismiss one layer.
 */
export function useCloseOnEscape(onClose: () => void): void {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape' && !event.defaultPrevented) {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);
}
