/**
 * The heading block every screen opens with: an eyebrow label, the screen's
 * title, and one line saying what the screen is for. Not a copy from the clone
 * — `README.md` records that the clone ships no page header, so this is the
 * one `src/components/shared/` assembles from `base/` primitives.
 *
 * The four screens had this markup four times over, which is how Übersicht's
 * header ended up one element short of the other three. `action` is what
 * Kategorien needs: its "Kategorie hinzufügen" button sits on the header row,
 * and only then does the header become a two-column flex row.
 */

import type { ReactNode } from 'react';

type PageHeaderProps = {
  /** Small uppercase label above the title, naming the area the screen is in. */
  eyebrow: string;
  title: string;
  subtitle: string;
  /** A primary action rendered at the header's trailing edge, if the screen has one. */
  action?: ReactNode;
};

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: PageHeaderProps) {
  const heading = (
    <>
      <p className="text-text-tertiary text-[11px] font-semibold tracking-[0.06em] uppercase">
        {eyebrow}
      </p>
      <h1 className="text-text-primary text-page-title tracking-heading mt-2 font-semibold">
        {title}
      </h1>
      <p className="text-text-tertiary mt-2 max-w-[700px] text-sm leading-relaxed sm:text-base">
        {subtitle}
      </p>
    </>
  );

  if (action === undefined) {
    return <header>{heading}</header>;
  }

  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">{heading}</div>
      {action}
    </header>
  );
}
