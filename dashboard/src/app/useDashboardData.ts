/**
 * The one place the dashboard's data comes from — now the backend, through
 * the TanStack Query cache (ADR-0006). There is exactly one copy of server
 * state and this hook does not keep a second: `useState` is gone from it, and
 * the four lists below are the cache's own.
 *
 * `DashboardGate` sits above every caller and does not render its children
 * until all four have arrived, so the empty fallbacks here are unreachable —
 * they exist because `useQuery` types its data as possibly absent and this
 * hook must not hand a screen `Application[] | undefined`. They are module
 * constants rather than fresh literals so that a render cannot invalidate a
 * memo below on identity alone.
 *
 * **The writes are not requests yet.** They apply the change to the cache and
 * nothing more, which is the optimistic half of each move; issue #38 puts the
 * `PATCH`, the `POST` and the `DELETE` behind them and moves each one into
 * the container for its screen. Until then an edit lives until the next
 * refetch, and the live stream's refetch on `open` will undo it — a visible
 * consequence, written down rather than hidden, of connecting the reads
 * before the writes.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import type { Application, ApplicationEdit, Owner } from '@/domain/application';
import { isDiscarded, setDiscarded } from '@/domain/application';
import type { Category, CategoryDraft } from '@/domain/category';
import type { StateChange } from '@/domain/stateChange';
import { applicationsQuery, stateChangesQuery } from '@/queries/applications';
import { categoriesQuery } from '@/queries/categories';
import { queryKeys } from '@/queries/keys';
import { staffMembersQuery } from '@/queries/staffMembers';

const NO_APPLICATIONS: readonly Application[] = [];
const NO_CATEGORIES: readonly Category[] = [];
const NO_OWNERS: readonly Owner[] = [];
const NO_STATE_CHANGES: readonly StateChange[] = [];

export function useDashboardData(now: Date) {
  const queryClient = useQueryClient();

  /**
   * Every Application, discarded ones included, exactly as
   * `GET /api/v1/staff/applications` returns them — the working list is this
   * minus `isDiscarded`, so nothing has to be kept in step.
   */
  const applications = useQuery(applicationsQuery).data ?? NO_APPLICATIONS;

  /** Kategorien edits this list; Anfragen's filter, its rows and the drawer read it. */
  const categories = useQuery(categoriesQuery).data ?? NO_CATEGORIES;

  /** The Staff members an Application can be assigned to (`GET /members`). */
  const owners = useQuery(staffMembersQuery).data ?? NO_OWNERS;

  /**
   * The state history behind Übersicht's sparklines. Fetched here — and
   * refetched by the stream on every `open` — so that issue #39 has a
   * history to replay; no card reads it yet.
   */
  const stateChanges = useQuery(stateChangesQuery).data ?? NO_STATE_CHANGES;

  const writeApplications = useCallback(
    (change: (current: readonly Application[]) => Application[]) => {
      queryClient.setQueryData<Application[]>(
        queryKeys.applications,
        (current) => (current === undefined ? current : change(current)),
      );
    },
    [queryClient],
  );

  const writeCategories = useCallback(
    (change: (current: readonly Category[]) => Category[]) => {
      queryClient.setQueryData<Category[]>(queryKeys.categories, (current) =>
        current === undefined ? current : change(current),
      );
    },
    [queryClient],
  );

  /**
   * One Application, one field — the shape of `PATCH /applications/{id}`
   * (`API.md`). The screens name the change; turning it into a list is this
   * file's job, and issue #38's request.
   */
  const editApplication = useCallback(
    (id: string, change: ApplicationEdit) => {
      writeApplications((current) =>
        current.map((application) =>
          application.id === id ? { ...application, ...change } : application,
        ),
      );
    },
    [writeApplications],
  );

  /**
   * The three moves over `discardedAt` (`A16`). Discarding and restoring are
   * one field on one list; erasing is the only one that drops a row, and it is
   * reachable from the fourth screen alone.
   *
   * `discardedAt` is stamped from `now` rather than from the clock, so a test
   * that injects a reference date sees the date it injected. On the wire the
   * server stamps it and the stream echoes the stamp back (`API.md`).
   */
  const discard = useCallback(
    (ids: ReadonlySet<string>) => {
      writeApplications((current) =>
        setDiscarded(current, ids, now.toISOString()),
      );
    },
    [writeApplications, now],
  );

  const restore = useCallback(
    (ids: ReadonlySet<string>) => {
      writeApplications((current) => setDiscarded(current, ids, null));
    },
    [writeApplications],
  );

  const erase = useCallback(
    (ids: ReadonlySet<string>) => {
      writeApplications((current) =>
        current.filter((application) => !ids.has(application.id)),
      );
    },
    [writeApplications],
  );

  /**
   * The five moves Kategorien makes, one per endpoint in `API.md`'s
   * "Categories" block. The id of a new Category is the server's to mint;
   * until issue #38 sends the `POST` a random UUID stands in for the one it
   * will hand back, and nothing derives it from the name.
   */
  const createCategory = useCallback(
    (draft: CategoryDraft) => {
      writeCategories((current) => [
        ...current,
        { id: crypto.randomUUID(), ...draft },
      ]);
    },
    [writeCategories],
  );

  const editCategory = useCallback(
    (id: string, draft: CategoryDraft) => {
      writeCategories((current) =>
        current.map((category) =>
          category.id === id ? { ...category, ...draft } : category,
        ),
      );
    },
    [writeCategories],
  );

  const setCategoryActive = useCallback(
    (id: string, active: boolean) => {
      writeCategories((current) =>
        current.map((category) =>
          category.id === id ? { ...category, active } : category,
        ),
      );
    },
    [writeCategories],
  );

  const deleteCategory = useCallback(
    (id: string) => {
      writeCategories((current) =>
        current.filter((category) => category.id !== id),
      );
    },
    [writeCategories],
  );

  /**
   * The whole order, as `PUT …/categories/order` takes it. The server rejects
   * an order that is not a permutation of the list (`ORDER_INCOMPLETE`); here
   * an unknown id is dropped and an omitted Category appended, so a stale
   * order cannot silently lose one.
   */
  const reorderCategories = useCallback(
    (orderedIds: readonly string[]) => {
      writeCategories((current) => {
        const byId = new Map(
          current.map((category) => [category.id, category]),
        );
        const ordered = orderedIds
          .map((id) => byId.get(id))
          .filter((category): category is Category => category !== undefined);
        const orderedSet = new Set(ordered.map((category) => category.id));

        return [
          ...ordered,
          ...current.filter((category) => !orderedSet.has(category.id)),
        ];
      });
    },
    [writeCategories],
  );

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

  return {
    applications,
    editApplication,
    categories,
    createCategory,
    editCategory,
    setCategoryActive,
    deleteCategory,
    reorderCategories,
    owners,
    stateChanges,
    discardedApplications,
    discard,
    restore,
    erase,
  };
}
