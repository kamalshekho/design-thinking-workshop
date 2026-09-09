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
 * - **`retry: 1`.** One retry absorbs a dropped request without making the
 *   failure state slow to reach. A `401` is not retried at all — the session
 *   query says so for itself, since there it is an answer rather than a
 *   failure.
 *
 * Recognising an expired Sign-in at this level — clearing the session entry
 * when any query answers `UNAUTHENTICATED`, so the sign-in screen covers the
 * dashboard without losing the work below it — is issue #40.
 */

import { QueryClient } from '@tanstack/react-query';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: Infinity,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
}
