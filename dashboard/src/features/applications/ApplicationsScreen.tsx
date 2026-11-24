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

import { Inbox01 } from '@untitledui/icons';
import { useMemo, useState } from 'react';

import {
  ApplicationActionOverlays,
  DiscardSelectedButton,
} from '@/components/shared/ApplicationActionControls';
import { ApplicationsList } from '@/components/shared/ApplicationsList';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { TabStrip } from '@/components/shared/tab-strip';
import { de } from '@/content/de';
import type {
  Application,
  ApplicationEdit,
  ApplicationView,
  Owner,
} from '@/domain/application';
import { APPLICATION_VIEWS, isDiscarded } from '@/domain/application';
import type { Category } from '@/domain/category';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useApplicationActions } from '@/hooks/useApplicationActions';
import type { NotesField } from '@/hooks/useNotesDraft';
import type { ApplicationFilters } from '@/utils/filterApplications';
import { EMPTY_FILTERS, filterApplications } from '@/utils/filterApplications';

import { ApplicationsToolbar } from './ApplicationsToolbar';

type ApplicationsScreenProps = {
  /** The signed-in Staff member, whom "Übernehmen" on the phone page makes the Owner. */
  staffMemberId: string;
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
  /**
   * The internal-notes draft, held by the container above (`useNotesDraft`):
   * the note is the one field that is not read from the cache while it is
   * being typed.
   */
  notes: NotesField;
};

export function ApplicationsScreen({
  staffMemberId,
  now,
  initialFilters,
  applications,
  onEdit,
  onDiscard,
  categories,
  owners,
  notes,
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

  /** Below 640 px the rows have no checkbox, so a bulk button could never be pressed. */
  const canSelectRows = useBreakpoint('sm');

  /**
   * Two empty states, the pair Kategorien and Aussortiert already draw: a
   * backend with no Applications at all is the platform's first day, while an
   * empty list under a view, a search or a filter is a narrowing the Staff
   * member can undo.
   */
  const nothingAtAll = applications.length === 0;

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
        {...actions.listProps}
        emptyState={
          <EmptyState
            icon={Inbox01}
            title={
              nothingAtAll ? de.applications.empty : de.applications.noMatches
            }
            hint={
              nothingAtAll
                ? de.applications.emptyHint
                : de.applications.noMatchesHint
            }
          />
        }
        toolbar={
          <>
            <div className="flex max-w-full flex-[1_0_auto] gap-3">
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

            {canSelectRows ? <DiscardSelectedButton actions={actions} /> : null}
          </>
        }
      />

      <ApplicationActionOverlays
        actions={actions}
        staffMemberId={staffMemberId}
        categories={categories}
        owners={owners}
        notes={notes}
      />
    </div>
  );
}
