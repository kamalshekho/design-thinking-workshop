/**
 * What a table card shows in place of its rows: an icon in a tinted square,
 * one line naming the state, one line saying what to do about it, and — where
 * the screen has one — the action that fills the list.
 *
 * Kategorien and Aussortiert each carried this markup inline, once for the
 * empty list and once for "nothing matches the search", which is why both
 * screens pass the wording in rather than choosing it here.
 */

import type { FC, ReactNode } from 'react';

type EmptyStateProps = {
  icon: FC<{ className?: string }>;
  title: string;
  hint: string;
  action?: ReactNode;
};

export function EmptyState({
  icon: Icon,
  title,
  hint,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
      <span
        aria-hidden="true"
        className="ring-secondary bg-secondary mb-2 flex size-11 items-center justify-center rounded-xl ring-1"
      >
        <Icon className="text-fg-quaternary size-5" />
      </span>
      <p className="text-text-primary text-sm font-medium">{title}</p>
      <p className="text-text-tertiary max-w-[42ch] text-sm leading-relaxed">
        {hint}
      </p>
      {action === undefined ? null : <span className="mt-3">{action}</span>}
    </div>
  );
}
