/**
 * The Applications list as Anfragen and as Übersicht's "Offene Anfragen"
 * panel render it: one `ApplicationTable`, the same per-row discard action,
 * and — on Anfragen — the screen's toolbar above the card.
 *
 * One component rather than a `ApplicationsGrid`/`OpenApplicationsGrid` pair,
 * which differed only in the props they forwarded while both spelled out the
 * same `rowActions` descriptor. What each screen still decides is what it
 * disagrees about: the accessible name of the table, whether the list pages,
 * which end of the queue leads, and whether there is a toolbar at all.
 */

import { Archive } from '@untitledui/icons';
import type { ReactNode } from 'react';
import { useMemo } from 'react';

import { ApplicationTable } from '@/components/application/application-table/application-table';
import { de } from '@/content/de';
import type { Application, Category, Owner } from '@/domain/application';

type ApplicationsListProps = {
  applications: readonly Application[];
  categories: readonly Category[];
  owners: readonly Owner[];
  now: Date;
  /** The "Lange offen" queue reads oldest-first; every other view is newest-first. */
  oldestFirst?: boolean;
  /** Übersicht's panel is already cut to five rows by its caller, so it pages nothing. */
  paginated?: boolean;
  ariaLabel: string;
  onSelect: (application: Application) => void;
  /** Ids checked via the row/header checkboxes, lifted so the screen's bulk discard button can read the same set. */
  selectedIds: ReadonlySet<string>;
  onSelectedIdsChange: (ids: ReadonlySet<string>) => void;
  onDiscard: (application: Application) => void;
  /** The Application the drawer shows, marked in the list. */
  activeId?: string | null;
  /** The named views and the search/filter controls, rendered above the table card. */
  toolbar?: ReactNode;
};

export function ApplicationsList({
  applications,
  categories,
  owners,
  now,
  oldestFirst,
  paginated,
  ariaLabel,
  onSelect,
  selectedIds,
  onSelectedIdsChange,
  onDiscard,
  activeId,
  toolbar,
}: ApplicationsListProps) {
  const rowActions = useMemo(
    () => [
      {
        // Discarding is reversible on the fourth screen (`A16`), so the row
        // action asks nothing and does not read as destructive.
        id: 'discard',
        icon: Archive,
        label: (application: Application) =>
          de.applications.discardOne(application.name),
        onAction: onDiscard,
      },
    ],
    [onDiscard],
  );

  const table = (
    <ApplicationTable
      applications={applications}
      categories={categories}
      owners={owners}
      now={now}
      oldestFirst={oldestFirst}
      paginated={paginated}
      onSelect={onSelect}
      selectedIds={selectedIds}
      onSelectedIdsChange={onSelectedIdsChange}
      rowActions={rowActions}
      activeId={activeId}
      ariaLabel={ariaLabel}
    />
  );

  if (toolbar === undefined) {
    return table;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3 max-md:flex-col max-md:items-stretch">
        {toolbar}
      </div>
      {table}
    </div>
  );
}
