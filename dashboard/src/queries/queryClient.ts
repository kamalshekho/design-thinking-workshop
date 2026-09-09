/**
 * The one copy of server state the dashboard keeps (ADR-0006).
 *
 * Three defaults carry the reasoning:
 *
 * - **`staleTime: Infinity`.** Freshness is not a timer here. The live stream
 *   applies each change as it happens and refetches everything on every
 *   `open`, so a background refetch on an interval would ask a question the
 *   stream has already answered — and would do it while a Staff member is
 *   typing into the drawer;
 * - **no refetch on window focus.** Same reason, and a sharper one: an
 *   optimistic write that has not yet been echoed by the stream would be
 *   replaced by a refetch triggered by nothing more than switching tabs;
 * - **`retry: 1`, and never a `401`.** One retry absorbs a dropped request
 *   without making the failure state slow to reach. An expired Sign-in is not
 *   a dropped request: asking again cannot make the cookie come back, and each
 *   attempt is time the dashboard spends before admitting the Sign-in is gone.
 *
 * **An expired Sign-in is recognised here and nowhere else.** Both caches get
 * an `onError`, so every read and every write in the dashboard passes one
 * check: a `401 UNAUTHENTICATED` from any of them means the Sign-in ran out,
 * and the Sign-in entry is marked expired — which is what puts the sign-in
 * cover over a dashboard that stays mounted, with the work below it intact
 * (`session.ts`, `app/SignInCover.tsx`).
 *
 * The cache is the right level for it because the alternative is every caller.
 * The transport cannot do it — it knows nothing about React or about the cache
 * — and a check in each query and each mutation is the same rule written a
 * dozen times, one of which would be forgotten the next time an endpoint is
 * added.
 */

import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';

import { isUnauthenticated } from '@/api/problem';

import { markSignInExpired } from './session';

export function createQueryClient(): QueryClient {
  /**
   * Both callbacks close over the client they belong to, which does not exist
   * until the caches do. They only ever run from a settled request, long after
   * this function has returned.
   */
  function onError(failure: unknown): void {
    if (isUnauthenticated(failure)) {
      markSignInExpired(client);
    }
  }

  const client = new QueryClient({
    queryCache: new QueryCache({ onError }),
    mutationCache: new MutationCache({ onError }),
    defaultOptions: {
      queries: {
        staleTime: Infinity,
        refetchOnWindowFocus: false,
        retry: (attempts, failure) =>
          !isUnauthenticated(failure) && attempts < 1,
      },
    },
  });

  return client;
}
