/**
 * The `cancelQueries` / snapshot / rollback triad, written once (ADR-0006).
 *
 * Four moves are optimistic — Status, Owner, discard and restore — and each of
 * them needs the same three steps in the same order:
 *
 * - **cancel first.** A refetch already in flight would land after the
 *   optimistic write and overwrite it with the list as it was before the
 *   change;
 * - **snapshot, then change.** The snapshot is the whole list, because a
 *   failure has to put back what was there rather than guess an inverse of the
 *   change;
 * - **on failure, restore and then invalidate.** Restoring is what the Staff
 *   member sees; invalidating is what makes the list true again, since the
 *   snapshot is only the dashboard's own last belief about it.
 *
 * A cache entry that is not there is left alone: `DashboardGate` does not
 * render a screen before its list has arrived, so there is no state in which a
 * write reaches a cache without one — and writing a change into an absent
 * entry would put a one-row list on screen until the fetch replaced it.
 */

import type { QueryClient, QueryKey } from '@tanstack/react-query';

export type ListChange<T> = (current: readonly T[]) => T[];

export type OptimisticList<T> = {
  /**
   * Applies the change and hands back what was there, for the rollback. The
   * return value is the mutation's context, so it is shaped as an object
   * rather than a bare array — a mutation whose context is `undefined` is
   * indistinguishable from one that never ran `onMutate`.
   */
  apply: (change: ListChange<T>) => Promise<{ snapshot: T[] | undefined }>;
  /** Puts the snapshot back, then asks the server what is really there. */
  rollback: (snapshot: T[] | undefined) => void;
  /** The same write without a snapshot, for a change that is not being undone. */
  write: (change: ListChange<T>) => void;
};

export function optimisticList<T>(
  queryClient: QueryClient,
  queryKey: QueryKey,
): OptimisticList<T> {
  function write(change: ListChange<T>): void {
    queryClient.setQueryData<T[]>(queryKey, (current) =>
      current === undefined ? current : change(current),
    );
  }

  return {
    apply: async (change) => {
      await queryClient.cancelQueries({ queryKey });
      const snapshot = queryClient.getQueryData<T[]>(queryKey);
      write(change);
      return { snapshot };
    },

    rollback: (snapshot) => {
      if (snapshot !== undefined) {
        queryClient.setQueryData<T[]>(queryKey, snapshot);
      }

      void queryClient.invalidateQueries({ queryKey });
    },

    write,
  };
}
