/**
 * The two Application reads and the three writes, as cache entries and
 * mutations.
 *
 * Neither read has a `staleTime` of its own: the client's default is
 * `Infinity` (`queryClient.ts`), because freshness here does not come from a
 * timer. The live stream refetches both on every `open`, including every
 * reconnect, and applies each event to the list in between — which is what
 * `API.md` says makes a dashboard without a replay buffer correct.
 *
 * The writes are asymmetrical on purpose (ADR-0006). An edit, a discard and a
 * restore are **optimistic**: they are one click, the Staff member is looking
 * at the row, and the `PATCH` answers with the complete Application, so the
 * optimistic guess is replaced by the server's own row rather than left
 * standing until the stream echoes it. The permanent erase **awaits the
 * server**, because there is no undo behind it and a row that vanished
 * optimistically and came back would read as a bug in the one place the
 * dashboard really deletes something.
 *
 * A bulk action is N single requests (`API.md`) — there is no bulk endpoint —
 * and one failure among them fails the whole mutation: the rollback puts the
 * list back and the invalidation then asks the server what actually happened,
 * so the successful requests keep their effect and the list, not the
 * dashboard's optimism, says so.
 */

import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import {
  eraseApplication,
  fetchApplications,
  fetchStateChanges,
  patchApplication,
} from '@/api/applications';
import type { Application, ApplicationEdit } from '@/domain/application';
import type { StateChange } from '@/domain/stateChange';

import { upsertApplication } from './applicationEvents';
import { queryKeys } from './keys';
import { optimisticList } from './optimistic';
import { useReportWriteFailure } from './writeFailures';

/** Every Application, discarded ones included; the screens filter for themselves. */
export const applicationsQuery = queryOptions({
  queryKey: queryKeys.applications,
  queryFn: () => fetchApplications(),
});

/** The state history Übersicht's sparklines are replayed from. */
export const stateChangesQuery = queryOptions({
  queryKey: queryKeys.stateChanges,
  queryFn: () => fetchStateChanges(),
});

const NO_APPLICATIONS: readonly Application[] = [];
const NO_STATE_CHANGES: readonly StateChange[] = [];

/**
 * The list a container hands its screen. The fallbacks are unreachable —
 * `DashboardGate` does not render a screen until all four reads have arrived —
 * and exist because `useQuery` types its data as possibly absent and no screen
 * may be handed `Application[] | undefined`. They are module constants rather
 * than fresh literals so that a render cannot invalidate a memo below on
 * identity alone.
 */
export function useApplications(): readonly Application[] {
  return useQuery(applicationsQuery).data ?? NO_APPLICATIONS;
}

export function useStateChanges(): readonly StateChange[] {
  return useQuery(stateChangesQuery).data ?? NO_STATE_CHANGES;
}

/** What the drawer changes about one Application: `PATCH …/{id}` (`API.md`). */
export type ApplicationEditVariables = {
  id: string;
  change: ApplicationEdit;
};

export function useEditApplication() {
  const queryClient = useQueryClient();
  const report = useReportWriteFailure();
  const list = optimisticList<Application>(queryClient, queryKeys.applications);

  return useMutation({
    mutationFn: ({ id, change }: ApplicationEditVariables) =>
      patchApplication(id, change),

    onMutate: ({ id, change }) =>
      list.apply((current) =>
        current.map((application) =>
          application.id === id ? { ...application, ...change } : application,
        ),
      ),

    /**
     * The response is the whole Application, so it replaces the optimistic row
     * outright rather than being merged into it — the server may have changed
     * more than was asked, and this is the same upsert the stream's echo of
     * the change will apply a moment later.
     */
    onSuccess: (application) => {
      list.write((current) => upsertApplication(current, application));
    },

    onError: (failure, _variables, context) => {
      list.rollback(context?.snapshot);
      report(failure);
    },
  });
}

/**
 * Discard and restore, in one mutation: they are one field on the wire
 * (`PATCH … { discarded }`) and one function in the domain (`setDiscarded`).
 *
 * `discardedAt` is passed in rather than read from the clock here, so a test
 * that injects a reference date sees the date it injected — and it is only the
 * optimistic guess either way: the server stamps its own and the response
 * carries the stamp back, because a timestamp from a browser's clock is worth
 * nothing as a record (`API.md`).
 */
export type SetDiscardedVariables = {
  ids: ReadonlySet<string>;
  /** An ISO timestamp to discard, `null` to restore. */
  discardedAt: string | null;
};

export function useSetDiscarded() {
  const queryClient = useQueryClient();
  const report = useReportWriteFailure();
  const list = optimisticList<Application>(queryClient, queryKeys.applications);

  return useMutation({
    mutationFn: ({ ids, discardedAt }: SetDiscardedVariables) =>
      allOrThrow(
        [...ids].map((id) =>
          patchApplication(id, { discarded: discardedAt !== null }),
        ),
      ),

    onMutate: ({ ids, discardedAt }) =>
      list.apply((current) =>
        current.map((application) =>
          ids.has(application.id)
            ? { ...application, discardedAt }
            : application,
        ),
      ),

    onSuccess: (applications) => {
      list.write((current) =>
        applications.reduce<Application[]>(
          (rows, application) => upsertApplication(rows, application),
          [...current],
        ),
      );
    },

    onError: (failure, _variables, context) => {
      list.rollback(context?.snapshot);
      report(failure);
    },
  });
}

/**
 * The permanent erase — the only path in the dashboard that deletes what a
 * person wrote, and the reason it awaits the server rather than guessing
 * (`API.md`).
 *
 * The State changes go with the Application, in the backend's own
 * transaction, so the history behind Übersicht's sparklines is refetched too:
 * the erase is the one write whose effect reaches a second cache entry.
 */
export function useEraseApplications() {
  const queryClient = useQueryClient();
  const report = useReportWriteFailure();
  const list = optimisticList<Application>(queryClient, queryKeys.applications);

  return useMutation({
    mutationFn: (ids: ReadonlySet<string>) =>
      allOrThrow([...ids].map((id) => eraseApplication(id))),

    onSuccess: (_erased, ids) => {
      list.write((current) =>
        current.filter((application) => !ids.has(application.id)),
      );
    },

    onError: (failure) => {
      report(failure);
      void queryClient.invalidateQueries({
        queryKey: queryKeys.applications,
      });
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.stateChanges });
    },
  });
}

/**
 * Every request, then the first failure among them — the shape a bulk action
 * needs (`API.md`, "Bulk actions are N single requests").
 *
 * `Promise.all` would reject on the first failure while the rest were still in
 * flight, leaving the dashboard unsure which of them landed. Waiting for all
 * of them and *then* failing is what makes "the successful requests keep their
 * effect" true, and the refetch the rollback triggers is what says which those
 * were.
 */
async function allOrThrow<T>(requests: Promise<T>[]): Promise<T[]> {
  const results = await Promise.allSettled(requests);
  const failed = results.find(
    (result): result is PromiseRejectedResult => result.status === 'rejected',
  );

  if (failed !== undefined) {
    throw failed.reason;
  }

  return results.flatMap((result) =>
    result.status === 'fulfilled' ? [result.value] : [],
  );
}
