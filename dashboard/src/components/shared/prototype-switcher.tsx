/**
 * PROTOTYPE (issue #109), throwaway. The floating bar that flips between the
 * variants in `src/prototype/variant.ts`. Renders nothing in a production
 * build.
 */

import { ChevronLeft, ChevronRight } from '@untitledui/icons';
import { useEffect, useState } from 'react';

import {
  setPrototypeVariant,
  usePrototypeVariant,
  VARIANTS,
} from '@/prototype/variant';

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  return (
    target.closest('input, textarea, select, [contenteditable="true"]') !== null
  );
}

export function PrototypeSwitcher() {
  const current = usePrototypeVariant();
  const [width, setWidth] = useState(() => window.innerWidth);
  const index = VARIANTS.findIndex((variant) => variant.key === current);

  function step(delta: number): void {
    const next = (index + delta + VARIANTS.length) % VARIANTS.length;
    setPrototypeVariant(VARIANTS[next]?.key ?? '0');
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent): void {
      if (isTyping(event.target) || event.altKey || event.metaKey) {
        return;
      }
      if (event.key === 'ArrowLeft') {
        step(-1);
      } else if (event.key === 'ArrowRight') {
        step(1);
      }
    }
    function onResize(): void {
      setWidth(window.innerWidth);
    }
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
    };
  });

  if (!import.meta.env.DEV) {
    return null;
  }

  const button =
    'flex size-7 cursor-pointer items-center justify-center rounded-full hover:bg-white/15';

  return (
    <div className="pointer-events-none fixed inset-x-0 top-[60px] z-[100] flex justify-center lg:top-auto lg:bottom-4">
      <div className="pointer-events-auto flex items-center gap-1 rounded-full bg-neutral-900 px-1.5 py-1 font-mono text-xs text-white shadow-xl ring-2 ring-amber-400">
        <button
          type="button"
          aria-label="Vorherige Variante"
          className={button}
          onClick={() => {
            step(-1);
          }}
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="px-1.5 whitespace-nowrap">
          {current} · {VARIANTS[index]?.name}
          <span className="ml-2 text-amber-300">{width}px</span>
        </span>
        <button
          type="button"
          aria-label="Nächste Variante"
          className={button}
          onClick={() => {
            step(1);
          }}
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
