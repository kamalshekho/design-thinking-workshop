/**
 * The Anfragen screen: page header, named views, filter bar, list, drawer.
 *
 * No metric cards here — Übersicht's `OverviewStats` owns those, and links
 * into this screen via `initialFilters` so a card's count and its list agree.
 *
 * Every Application, Category and Owner it shows is handed in: `App` owns the
 * one list the four screens share, so an edit here and one made through
 * Übersicht's panel touch the same Application rather than independent copies,
 * and the day the backend replaces the mock (issue #16) nothing in this file
 * changes.
 */

import { Archive } from '@untitledui/icons';
import { useMemo, useState } from 'react';

import { Button } from '@/components/base/buttons/button';
import { PageHeader } from '@/components/shared/page-header';
import { TabStrip } from '@/components/shared/tab-strip';
import { de } from '@/content/de';
import type {
  Application,
  ApplicationEdit,
  ApplicationView,
  Category,
  Owner,
} from '@/domain/application';
import { APPLICATION_VIEWS, isDiscarded } from '@/domain/application';

import { ApplicationDrawer } from './ApplicationDrawer';
import { ApplicationsList } from './ApplicationsList';
import { ApplicationsToolbar } from './ApplicationsToolbar';
import type { ApplicationFilters } from './filterApplications';
import { EMPTY_FILTERS, filterApplications } from './filterApplications';
import { useApplicationActions } from './useApplicationActions';

type ApplicationsScreenProps = {
  /** The reference date the relative ages and the "Lange offen" view are read against. */
  now: Date;
  /** The view/status a Übersicht metric card linked in with, if any. */
  initialFilters?: Partial<ApplicationFilters>;
  applications: readonly Application[];
  /** Changes Status, Owner or internal notes on one Application — a `PATCH`, not a new list. */
  onEdit: (id: string, change: ApplicationEdit) => void;
  /**
   * Discards the named Applications (`A16`) — they leave this list and appear
   * on the fourth screen.
   */
  onDiscard: (ids: ReadonlySet<string>) => void;
  /** Owned by Kategorien, so a Category renamed there is renamed in the filter, the list and the drawer at once. */
  categories: readonly Category[];
  owners: readonly Owner[];
};

export function ApplicationsScreen({
  now,
  initialFilters,
  applications,
  onEdit,
  onDiscard,
  categories,
  owners,
}: ApplicationsScreenProps) {
  const [filters, setFilters] = useState<ApplicationFilters>(() => ({
    ...EMPTY_FILTERS,
    ...initialFilters,
  }));

  const actions = useApplicationActions({
    applications,
    onEdit,
    onDiscard,
  });

  const visible = useMemo(
    () => filterApplications(applications, filters, now),
    [applications, filters, now],
  );

  const counts = useMemo(
    () =>
      Object.fromEntries(
        APPLICATION_VIEWS.map((view) => [
          view,
          filterApplications(applications, { ...filters, view }, now).length,
        ]),
      ) as Record<ApplicationView, number>,
    [applications, filters, now],
  );

  /**
   * The "of" figure counts the working list only: a discarded Application is
   * not one of the Anfragen this screen is about (`A16`).
   */
  const workingCount = useMemo(
    () =>
      applications.filter((application) => !isDiscarded(application)).length,
    [applications],
  );

  const { selected } = actions;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow={de.applications.eyebrow}
        title={de.applications.title}
        subtitle={de.applications.subtitle}
      />

      <p className="text-secondary text-sm">
        {de.applications.count(visible.length, workingCount)}
      </p>

      <ApplicationsList
        applications={visible}
        categories={categories}
        owners={owners}
        now={now}
        oldestFirst={
          filters.view === 'stale' || filters.excludeCompleted === true
        }
        paginated
        ariaLabel={de.applications.title}
        onSelect={(application) => {
          actions.toggle(application.id);
        }}
        selectedIds={actions.selectedIds}
        onSelectedIdsChange={actions.setSelectedIds}
        activeId={actions.selectedId}
        onDiscard={(application) => {
          actions.discard(new Set([application.id]));
        }}
        toolbar={
          <>
            <div className="flex min-w-0 flex-1 flex-wrap gap-3">
              <TabStrip
                ariaLabel={de.applications.title}
                views={APPLICATION_VIEWS}
                labels={de.views}
                counts={counts}
                current={filters.view}
                onChange={(view) => {
                  setFilters({ ...filters, view });
                }}
              />
            </div>

            <ApplicationsToolbar
              filters={filters}
              categories={categories}
              onChange={setFilters}
            />

            {/*
             * Always on the bar, disabled while nothing is checked, so the
             * bulk action stays discoverable instead of appearing out of
             * nowhere and shifting the toolbar the moment a row is ticked.
             * It discards rather than deletes (`A16`) — hence the label and
             * the archive icon, not a trash can.
             */}
            <Button
              size="md"
              color="secondary"
              iconLeading={Archive}
              isDisabled={actions.selectedIds.size === 0}
              onClick={actions.discardSelected}
            >
              {de.applications.discardSelected(actions.selectedIds.size)}
            </Button>
          </>
        }
      />

      {selected ? (
        <ApplicationDrawer
          application={selected}
          categories={categories}
          owners={owners}
          onClose={actions.close}
          onChange={(change) => {
            actions.update(selected.id, change);
          }}
        />
      ) : null}
    </div>
  );
}
