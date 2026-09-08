/**
 * The fourth screen: the Discarded Applications (`A16`).
 *
 * Discarding on Anfragen or on Übersicht's panel takes an Application out of
 * the working list and leaves it here, with its Category, Status, Owner and
 * notes intact. From here a Staff member either restores it, or erases it in a
 * second, deliberate action — the only path in the dashboard that actually
 * deletes what a person wrote, and the reason `API.md` gives it an endpoint of
 * its own.
 *
 * Assembled from the same parts the other two list screens are — page header,
 * a bar over the table card, one `ApplicationTable` — so moving here is a
 * change of content, not of layout. What it does differently, and why:
 *
 * - **two row actions instead of one.** Wiederherstellen is the way back and
 *   asks nothing; endgültig löschen names its consequence in the confirmation;
 * - **no named views, no filter.** Status and Zuständigkeit are the queues a
 *   Staff member works; this list is looked through by name, so the bar
 *   carries the search field alone;
 * - **no drawer.** Everything a Staff member can do to a discarded
 *   Application is on its row — Status, Owner and notes are not editable
 *   while it is out of the working list — so a row here opens nothing and is
 *   not clickable;
 * - **no unread emphasis.** A discarded Application without an Owner is not
 *   waiting for one, so the tint and the bold name of `A14` would point at
 *   nothing here.
 *
 * Both bulk buttons stay on the bar and disable while nothing is checked, the
 * same rule Anfragen follows, so ticking a row never shifts the bar.
 */

import { Archive, FlipBackward, Trash01, Trash03 } from '@untitledui/icons';
import { useMemo, useRef, useState } from 'react';

import type { ApplicationRowAction } from '@/components/application/application-table/application-table';
import { ApplicationTable } from '@/components/application/application-table/application-table';
import { Button } from '@/components/base/buttons/button';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { de } from '@/content/de';
import type { Application, Category, Owner } from '@/domain/application';
import { matchesSearch } from '@/features/applications/filterApplications';
import { SearchField } from '@/features/applications/SearchField';
import { useSearchShortcut } from '@/hooks/use-search-shortcut';

type DiscardedApplicationsScreenProps = {
  /**
   * The discarded Applications, already selected by `App` — this screen shows
   * every row it is handed.
   */
  applications: readonly Application[];
  /** Back into the working list, unchanged. */
  onRestore: (ids: ReadonlySet<string>) => void;
  /** Gone for good; nothing keeps a copy. */
  onErase: (ids: ReadonlySet<string>) => void;
  /** Handed down so a row reads the Category name Kategorien holds. */
  categories: readonly Category[];
  owners: readonly Owner[];
  /** The reference date the rows' relative ages are read against. */
  now: Date;
};

export function DiscardedApplicationsScreen({
  applications,
  onRestore,
  onErase,
  categories,
  owners,
  now,
}: DiscardedApplicationsScreenProps) {
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(
    new Set(),
  );

  const searchRef = useRef<HTMLInputElement>(null);
  useSearchShortcut(searchRef);

  const visible = useMemo(
    () =>
      applications.filter((application) => matchesSearch(application, search)),
    [applications, search],
  );

  /** Ids checked but no longer here cannot be acted on any more. */
  function forget(ids: ReadonlySet<string>): void {
    setSelectedIds((current) => {
      const next = new Set(current);
      for (const id of ids) {
        next.delete(id);
      }
      return next;
    });
  }

  function restore(ids: ReadonlySet<string>): void {
    onRestore(ids);
    forget(ids);
  }

  function erase(ids: ReadonlySet<string>): void {
    onErase(ids);
    forget(ids);
  }

  const rowActions: ApplicationRowAction[] = [
    {
      id: 'restore',
      icon: FlipBackward,
      label: (application) => de.discarded.restoreOne(application.name),
      onAction: (application) => {
        restore(new Set([application.id]));
      },
    },
    {
      id: 'erase',
      icon: Trash03,
      label: (application) => de.discarded.eraseOne(application.name),
      confirm: (application) => de.discarded.confirmEraseOne(application.name),
      destructive: true,
      onAction: (application) => {
        erase(new Set([application.id]));
      },
    },
  ];

  const isSearching = search.trim() !== '';

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow={de.discarded.eyebrow}
        title={de.discarded.title}
        subtitle={de.discarded.subtitle}
      />

      <p className="text-secondary text-sm">
        {de.discarded.count(visible.length, applications.length)}
      </p>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3 max-md:flex-col max-md:items-stretch">
          <div className="flex min-w-0 flex-1 flex-wrap gap-3">
            <SearchField ref={searchRef} value={search} onChange={setSearch} />
          </div>

          {/*
           * Wiederherstellen leads: it is the reason this screen exists, and
           * the irreversible action sits after it in the danger colour, so the
           * two never read as a pair of equals.
           */}
          <Button
            size="md"
            color="secondary"
            iconLeading={FlipBackward}
            isDisabled={selectedIds.size === 0}
            onClick={() => {
              restore(selectedIds);
            }}
          >
            {de.discarded.restoreSelected(selectedIds.size)}
          </Button>

          <Button
            size="md"
            color="secondary-destructive"
            iconLeading={Trash01}
            isDisabled={selectedIds.size === 0}
            onClick={() => {
              if (
                selectedIds.size > 0 &&
                window.confirm(
                  de.discarded.confirmEraseSelected(selectedIds.size),
                )
              ) {
                erase(selectedIds);
              }
            }}
          >
            {de.discarded.eraseSelected(selectedIds.size)}
          </Button>
        </div>

        <ApplicationTable
          applications={visible}
          categories={categories}
          owners={owners}
          now={now}
          paginated
          unreadState={false}
          selectedIds={selectedIds}
          onSelectedIdsChange={setSelectedIds}
          rowActions={rowActions}
          ariaLabel={de.discarded.title}
          emptyState={
            <EmptyState
              icon={Archive}
              title={isSearching ? de.discarded.noMatches : de.discarded.empty}
              hint={
                isSearching
                  ? de.discarded.noMatchesHint
                  : de.discarded.emptyHint
              }
            />
          }
        />
      </div>
    </div>
  );
}
