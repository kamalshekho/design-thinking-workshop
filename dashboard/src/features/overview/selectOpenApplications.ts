/**
 * Pure selection for Übersicht's "Offene Anfragen" panel. Reuses Anfragen's
 * own `matchesSearch`/`matchesOwner` so both screens agree on what counts as
 * a hit; the panel differs only in what it does with the result — excluding
 * `COMPLETED_APPLICATION_STATUSES` and sorting oldest first, unconditionally,
 * rather than through a named view. Keeping this a pure function is what
 * makes the selection testable without rendering the grid, the same reason
 * `filterApplications.ts` is one.
 */

import type { Application } from '@/domain/application';
import {
  COMPLETED_APPLICATION_STATUSES,
  isDiscarded,
} from '@/domain/application';
import type { OwnerFilter } from '@/features/applications/filterApplications';
import {
  matchesOwner,
  matchesSearch,
} from '@/features/applications/filterApplications';

export type OpenApplicationsFilters = {
  search: string;
  categoryId: string | null;
  ownerId: OwnerFilter;
};

export const EMPTY_OPEN_APPLICATIONS_FILTERS: OpenApplicationsFilters = {
  search: '',
  categoryId: null,
  ownerId: null,
};

/** Our own proposal for a compact overview, not a confirmed client need (`A13`). */
export const OPEN_APPLICATIONS_LIMIT = 5;

/**
 * Every open Application matching the filters, oldest first, unlimited — the
 * "of" figure in "5 von 18 offenen Anfragen" is this array's length, taken
 * before the caller slices to `OPEN_APPLICATIONS_LIMIT`.
 */
export function selectOpenApplications(
  applications: readonly Application[],
  filters: OpenApplicationsFilters,
): Application[] {
  return applications
    .filter(
      (application) =>
        // Discarded Applications are out of the working list entirely (`A16`).
        !isDiscarded(application) &&
        !COMPLETED_APPLICATION_STATUSES.includes(application.status) &&
        matchesSearch(application, filters.search) &&
        (filters.categoryId === null ||
          application.categoryId === filters.categoryId) &&
        matchesOwner(application, filters.ownerId),
    )
    .sort(
      (a, b) =>
        new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime(),
    );
}
