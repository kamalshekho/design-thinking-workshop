/**
 * Which Applications a screen shows: the named view, the search term, the
 * Category and Status selection, and — arriving from Übersicht — an Owner and
 * "open only". The table renders the rows it is handed and filters nothing
 * itself, so this stays a pure function and the behaviour is tested without a
 * table in jsdom.
 */

import type {
  Application,
  ApplicationStatus,
  ApplicationView,
} from '@/domain/application';
import {
  APPLICATION_STATUSES,
  APPLICATION_VIEWS,
  COMPLETED_APPLICATION_STATUSES,
  isDiscarded,
  STALE_AFTER_DAYS,
} from '@/domain/application';
import { daysSince } from '@/utils/dates';

/**
 * An owner id, the `'unassigned'` sentinel (matches an Application with no
 * owner), or `null` (matches every Application).
 */
export type OwnerFilter = string | null;

export type ApplicationFilters = {
  view: ApplicationView;
  search: string;
  categoryId: string | null;
  status: ApplicationStatus | null;
  /**
   * Owner equality filter. Optional because Anfragen's own toolbar does not
   * expose it — it only travels in from Übersicht's "Offene Anfragen" panel,
   * which does.
   */
  ownerId?: OwnerFilter;
  /**
   * True when arriving from Übersicht's "Offene Anfragen" panel: excludes
   * `COMPLETED_APPLICATION_STATUSES` independently of `view` or `status`, per
   * `A13`. Optional so existing `view`/`status` filtering is unaffected when
   * absent.
   */
  excludeCompleted?: boolean;
};

export const EMPTY_FILTERS: ApplicationFilters = {
  view: 'all',
  search: '',
  categoryId: null,
  status: null,
  ownerId: null,
  excludeCompleted: false,
};

function matchesView(
  application: Application,
  view: ApplicationView,
  now: Date,
): boolean {
  switch (view) {
    case 'all':
      return true;
    case 'unassigned':
      return application.ownerId === null;
    case 'stale':
      return daysSince(application.submittedAt, now) >= STALE_AFTER_DAYS;
  }
}

/** Exported so Übersicht's "Offene Anfragen" panel matches Anfragen exactly on what counts as a hit. */
export function matchesSearch(
  application: Application,
  search: string,
): boolean {
  const term = search.trim().toLowerCase();
  if (term === '') {
    return true;
  }
  return (
    application.name.toLowerCase().includes(term) ||
    application.email.toLowerCase().includes(term)
  );
}

/** Exported for the same reason as `matchesSearch`. */
export function matchesOwner(
  application: Application,
  ownerId: OwnerFilter | undefined,
): boolean {
  if (ownerId === undefined || ownerId === null) {
    return true;
  }
  if (ownerId === 'unassigned') {
    return application.ownerId === null;
  }
  return application.ownerId === ownerId;
}

/**
 * Reads the `view`/`status` query carried on an `#applications?...` hash, so
 * Übersicht's metric cards can deep-link into a pre-filtered Anfragen list.
 * Unknown or absent values are dropped rather than defaulted, so the caller's
 * own `EMPTY_FILTERS` spread still wins.
 */
export function parseFiltersFromHash(
  hash: string,
): Partial<ApplicationFilters> {
  const queryIndex = hash.indexOf('?');
  if (queryIndex === -1) {
    return {};
  }

  const params = new URLSearchParams(hash.slice(queryIndex + 1));
  const filters: Partial<ApplicationFilters> = {};

  const view = params.get('view');
  if (view && (APPLICATION_VIEWS as readonly string[]).includes(view)) {
    filters.view = view as ApplicationView;
  }

  const status = params.get('status');
  if (status && (APPLICATION_STATUSES as readonly string[]).includes(status)) {
    filters.status = status as ApplicationStatus;
  }

  const search = params.get('search');
  if (search !== null) {
    filters.search = search;
  }

  const categoryId = params.get('categoryId');
  if (categoryId !== null) {
    filters.categoryId = categoryId;
  }

  const ownerId = params.get('ownerId');
  if (ownerId !== null) {
    filters.ownerId = ownerId;
  }

  if (params.get('excludeCompleted') === '1') {
    filters.excludeCompleted = true;
  }

  return filters;
}

/**
 * The inverse of `parseFiltersFromHash`: builds the `#applications?...` link
 * Übersicht's "Offene Anfragen" panel uses for "Alle offenen Anfragen
 * ansehen", so the two stay in sync without duplicating the query shape.
 */
export function buildApplicationsHref(
  filters: Partial<ApplicationFilters>,
): string {
  const params = new URLSearchParams();
  if (filters.view) {
    params.set('view', filters.view);
  }
  if (filters.status) {
    params.set('status', filters.status);
  }
  if (filters.search) {
    params.set('search', filters.search);
  }
  if (filters.categoryId) {
    params.set('categoryId', filters.categoryId);
  }
  if (filters.ownerId) {
    params.set('ownerId', filters.ownerId);
  }
  if (filters.excludeCompleted) {
    params.set('excludeCompleted', '1');
  }
  return `#applications?${params.toString()}`;
}

/**
 * Anfragen's own list. Discarded Applications are not in it and not in the
 * view counts either (`A16`) — the fourth screen is the only place they show.
 */
export function filterApplications(
  applications: readonly Application[],
  filters: ApplicationFilters,
  now: Date,
): Application[] {
  return applications.filter(
    (application) =>
      !isDiscarded(application) &&
      matchesView(application, filters.view, now) &&
      matchesSearch(application, filters.search) &&
      (filters.categoryId === null ||
        application.categoryId === filters.categoryId) &&
      (filters.status === null || application.status === filters.status) &&
      matchesOwner(application, filters.ownerId) &&
      (!filters.excludeCompleted ||
        !COMPLETED_APPLICATION_STATUSES.includes(application.status)),
  );
}
