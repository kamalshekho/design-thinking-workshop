/**
 * PROTOTYPE (issue #109), throwaway. Variant B keeps the full table from
 * 768 px and says when columns are cut off: a fade on the edge that has more,
 * and a line above the table naming how many columns are hidden.
 */

import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';

import { cx } from '@/utils/cx';

export function ScrollHint({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false, hidden: 0 });

  useEffect(() => {
    const scroller =
      ref.current?.querySelector<HTMLElement>('.overflow-x-auto');
    if (!scroller) {
      return;
    }
    function measure(): void {
      if (!scroller) {
        return;
      }
      const box = scroller.getBoundingClientRect();
      const heads = [...scroller.querySelectorAll('th')];
      const hidden = heads.filter(
        (th) => th.getBoundingClientRect().right > box.right + 4,
      ).length;
      setEdges({
        left: scroller.scrollLeft > 2,
        right:
          scroller.scrollLeft + scroller.clientWidth < scroller.scrollWidth - 2,
        hidden,
      });
    }
    measure();
    scroller.addEventListener('scroll', measure, { passive: true });
    const observer = new ResizeObserver(measure);
    observer.observe(scroller);
    return () => {
      scroller.removeEventListener('scroll', measure);
      observer.disconnect();
    };
  }, []);

  return (
    <div className="flex flex-col gap-2">
      {edges.hidden > 0 ? (
        <p className="text-tertiary self-end text-xs">
          {edges.hidden === 1
            ? '1 weitere Spalte, seitlich scrollen →'
            : `${String(edges.hidden)} weitere Spalten, seitlich scrollen →`}
        </p>
      ) : null}
      <div ref={ref} className="relative">
        {children}
        <span
          aria-hidden="true"
          className={cx(
            'pointer-events-none absolute inset-y-0 left-0 w-10 rounded-l-xl bg-gradient-to-r from-black/10 to-transparent transition-opacity',
            edges.left ? 'opacity-100' : 'opacity-0',
          )}
        />
        <span
          aria-hidden="true"
          className={cx(
            'pointer-events-none absolute inset-y-0 right-0 w-10 rounded-r-xl bg-gradient-to-l from-black/10 to-transparent transition-opacity',
            edges.right ? 'opacity-100' : 'opacity-0',
          )}
        />
      </div>
    </div>
  );
}
