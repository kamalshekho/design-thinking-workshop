/**
 * The two Application reads, as cache entries.
 *
 * Neither has a `staleTime` of its own: the client's default is `Infinity`
 * (`queryClient.ts`), because freshness here does not come from a timer. The
 * live stream refetches both on every `open`, including every reconnect, and
 * applies each event to the list in between — which is what `API.md` says
 * makes a dashboard without a replay buffer correct.
 */

import { queryOptions } from '@tanstack/react-query';

import { fetchApplications, fetchStateChanges } from '@/api/applications';

import { queryKeys } from './keys';

/** Every Application, discarded ones included; the screens filter for themselves. */
export const applicationsQuery = queryOptions({
  queryKey: queryKeys.applications,
  queryFn: () => fetchApplications(),
});

/**
 * The state history the sparklines are replayed from. Fetched here and
 * replayed in issue #39 — until then the cards still count from the list
 * alone, which `API.md` explains is a curve that is confidently wrong.
 */
export const stateChangesQuery = queryOptions({
  queryKey: queryKeys.stateChanges,
  queryFn: () => fetchStateChanges(),
});
