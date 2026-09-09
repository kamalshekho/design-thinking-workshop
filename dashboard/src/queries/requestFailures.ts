/**
 * The one place a failed request is remembered, so that it is worded once.
 *
 * Two kinds of failure share the slot above the screens, because they have the
 * same shape (issue #58): a write that was refused has already been rolled
 * back underneath the Staff member, and a *refetch* that was refused has left
 * the list they are looking at standing but stale. Neither may replace the
 * screens — the work, the filters and the open drawer are still there — so
 * both are one sentence over the top of them.
 *
 * Only the write half is remembered here. A failed read is already in the
 * cache, with the four queries the notice subscribes to itself, so pushing it
 * through this context would store what the cache already holds; `report` is
 * what it was designed for, a mutation's `onError`, which has no cache entry
 * of its own.
 *
 * The failure is kept as it was thrown rather than as a German sentence. What
 * it says is `content/errorMessage.ts`'s decision, and keeping the
 * `ApiProblem` means a notice can read its `code` — or admit it has none,
 * which is the truth for a request the network never delivered.
 *
 * The context and its two hooks are here, beside the mutations that raise a
 * failure; the state and the notice are in `src/app/`, where the shell is.
 */

import { createContext, useContext } from 'react';

/** A failed write, and when it was reported. */
export type ReportedFailure = {
  failure: unknown;
  /**
   * `Date.now()` at the moment it was reported, compared against the failed
   * refetch's `errorUpdatedAt`: the slot holds one failure and the newer one
   * wins. A backend that is down fails the write and the refetch behind it,
   * and that is one thing that went wrong, not two sentences about one cause.
   */
  at: number;
};

export type RequestFailures = {
  /** The newest failed write, or `null` while every write has succeeded. */
  write: ReportedFailure | null;
  /**
   * When the notice was last dismissed. A failed read stays in the cache after
   * it has been read and dismissed, so the notice hides anything older than
   * this rather than clearing a query's error — and a *later* failure comes
   * back, which is the point.
   */
  dismissedAt: number;
  report: (failure: unknown) => void;
  dismiss: () => void;
};

/**
 * Provided by `app/RequestFailures.tsx`, which holds the state and renders the
 * notice. The default is a no-op rather than a throw: outside the dashboard —
 * on the sign-in screen, which words its own rejection next to the form —
 * there is nothing to report to, and a mutation hook should not have to ask
 * where it is mounted.
 */
export const RequestFailuresContext = createContext<RequestFailures>({
  write: null,
  dismissedAt: 0,
  report: () => undefined,
  dismiss: () => undefined,
});

/** What a mutation calls from its `onError`. */
export function useReportRequestFailure(): (failure: unknown) => void {
  return useContext(RequestFailuresContext).report;
}

/** What the notice in the shell reads. */
export function useRequestFailures(): Omit<RequestFailures, 'report'> {
  const { write, dismissedAt, dismiss } = useContext(RequestFailuresContext);
  return { write, dismissedAt, dismiss };
}
