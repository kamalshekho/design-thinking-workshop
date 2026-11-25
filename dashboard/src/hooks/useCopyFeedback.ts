import { useEffect, useState } from 'react';

const COPY_FEEDBACK_MS = 1800;

/**
 * Tracks the last copied value rather than a boolean flag so switching to
 * another Application resets the visual confirmation without an effect.
 */
export function useCopyFeedback(value: string | null) {
  const [copiedValue, setCopiedValue] = useState<string | null>(null);
  const copied = value !== null && copiedValue === value;

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timer = window.setTimeout(() => {
      setCopiedValue(null);
    }, COPY_FEEDBACK_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [copied]);

  function copy(): void {
    if (value === null) {
      return;
    }

    void navigator.clipboard.writeText(value);
    setCopiedValue(value);
  }

  return { copied, copy };
}
