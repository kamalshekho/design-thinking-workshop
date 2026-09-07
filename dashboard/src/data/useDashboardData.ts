/**
 * The one place the dashboard's data comes from, and the one place it will be
 * fetched from.
 *
 * Every screen used to reach for `mockApplications.ts` itself, as a fallback
 * behind a prop, which meant a screen rendered on its own showed a second,
 * independent copy of the list. Now `App` calls this hook and hands the result
 * down, so the mock is imported exactly once: replacing it with `GET
 * /applications` and `GET /categories` (`API.md`, issue #16) is a change to
 * this file and to nothing above it.
 *
 * Everything lives in memory for the session only — there is no token to keep
 * and no backend to validate one against yet, so a reload starts over.
 */

import { useCallback, useMemo, useState } from 'react';

import type { Application, Owner } from '@/domain/application';
import { isDiscarded, setDiscarded } from '@/domain/application';
import type { Category } from '@/domain/category';

import {
  createMockApplications,
  mockCategories,
  mockOwners,
} from './mockApplications';

export function useDashboardData(now: Date) {
  /**
   * Every Application, discarded ones included, exactly as `GET /applications`
   * will return them — the working list is this minus `isDiscarded`, so
   * nothing has to be kept in step.
   */
  const [applications, setApplications] = useState<Application[]>(() =>
    createMockApplications(now),
  );

  /** Kategorien edits this list; Anfragen's filter, its rows and the drawer read it. */
  const [categories, setCategories] = useState<Category[]>(mockCategories);

  /**
   * The three moves over `discardedAt` (`A16`). Discarding and restoring are
   * one field on one list; erasing is the only one that drops a row, and it is
   * reachable from the fourth screen alone.
   *
   * `discardedAt` is stamped from `now` rather than from the clock, so a test
   * that injects a reference date sees the date it injected. On the wire the
   * server stamps it (`API.md`).
   */
  const discard = useCallback(
    (ids: ReadonlySet<string>) => {
      setApplications((current) =>
        setDiscarded(current, ids, now.toISOString()),
      );
    },
    [now],
  );

  const restore = useCallback((ids: ReadonlySet<string>) => {
    setApplications((current) => setDiscarded(current, ids, null));
  }, []);

  const erase = useCallback((ids: ReadonlySet<string>) => {
    setApplications((current) =>
      current.filter((application) => !ids.has(application.id)),
    );
  }, []);

  /**
   * Newest first, so the Application a Staff member just discarded is the
   * first row on the fourth screen.
   */
  const discardedApplications = useMemo(
    () =>
      applications
        .filter(isDiscarded)
        .sort((a, b) =>
          (a.discardedAt ?? '') < (b.discardedAt ?? '') ? 1 : -1,
        ),
    [applications],
  );

  /** The Staff members an Application can be assigned to; server-owned (`A16`). */
  const owners: readonly Owner[] = mockOwners;

  return {
    applications,
    setApplications,
    categories,
    setCategories,
    owners,
    discardedApplications,
    discard,
    restore,
    erase,
  };
}
