/**
 * The one place a failed write is remembered, so that it is worded once.
 *
 * Reads answer for themselves — `DashboardGate` shows the failure panel and
 * offers a retry — but a write has no panel: the Staff member has already
 * moved on, and the change they made is being rolled back underneath them. So
 * every mutation reports its failure here and the shell renders one notice for
 * whatever the newest one is (`API.md`, "Bulk actions are N single requests":
 * a partial failure says so *once*, not once per request).
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

export type WriteFailures = {
  /** The newest failed write, or `null` while every write has succeeded. */
  failure: unknown;
  report: (failure: unknown) => void;
  dismiss: () => void;
};

/**
 * Provided by `app/WriteFailures.tsx`, which holds the state and renders the
 * notice. The default is a no-op rather than a throw: outside the dashboard —
 * on the sign-in screen, which words its own rejection next to the form —
 * there is nothing to report to, and a mutation hook should not have to ask
 * where it is mounted.
 */
export const WriteFailuresContext = createContext<WriteFailures>({
  failure: null,
  report: () => undefined,
  dismiss: () => undefined,
});

/** What a mutation calls from its `onError`. */
export function useReportWriteFailure(): (failure: unknown) => void {
  return useContext(WriteFailuresContext).report;
}

/** What the notice in the shell reads. */
export function useWriteFailure(): Pick<WriteFailures, 'failure' | 'dismiss'> {
  const { failure, dismiss } = useContext(WriteFailuresContext);
  return { failure, dismiss };
}
