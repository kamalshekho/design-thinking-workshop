/**
 * What a Staff member reads when a request failed. One notice for the whole
 * dashboard, above the screens, for the reason `API.md` gives about bulk
 * actions: a partial failure says so *once*, not once per request.
 *
 * **Two kinds of failure, one slot** (issue #58). A write that was refused has
 * already been rolled back underneath the Staff member; a refetch that was
 * refused has left the list they are looking at standing but stale. Both are
 * things that happened to work that is still on screen, so neither may replace
 * it the way `DashboardGate`'s panel replaces a dashboard that has nothing to
 * show yet.
 *
 * The wordings stay two, because what can be done about them differs. A write
 * has nothing to ask again — the change is gone and the list behind it has
 * already been refetched — so the notice only says what went wrong. A stale
 * list has nothing else worth offering, so it carries the retry the panel has,
 * over exactly the queries that failed.
 *
 * It is the sign-in screen's rejection block, in the shell: the same border,
 * the same tint and the same `role="alert"`, because it is the same kind of
 * sentence about the same kind of failure.
 *
 * Dismissable rather than self-clearing on a timer: the wording for
 * `CATEGORY_IN_USE` tells the Staff member what to do instead, and a sentence
 * that removes itself while it is being read is worse than one that waits. If
 * the backend really is gone, `StreamMarker` is saying so all the while —
 * which is the division that keeps the marker out of this: the marker is a
 * state, and a failed request is an event.
 *
 * One code never reaches it: a request refused because the Sign-in expired is
 * already answered by the cover coming up over the whole dashboard
 * (`SignInCover`), and a general "Aktion fehlgeschlagen" underneath it would
 * name a symptom while the real sentence sits on top of it.
 */

import { useQueries } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useCallback, useMemo, useState } from 'react';

import { isUnauthenticated, problemCode } from '@/api/problem';
import { Button } from '@/components/base/buttons/button';
import { de } from '@/content/de';
import { errorMessage } from '@/content/errorMessage';
import { applicationsQuery, stateChangesQuery } from '@/queries/applications';
import { categoriesQuery } from '@/queries/categories';
import type { RequestFailures as RequestFailuresValue } from '@/queries/requestFailures';
import {
  RequestFailuresContext,
  useRequestFailures,
} from '@/queries/requestFailures';
import { staffMembersQuery } from '@/queries/staffMembers';
import { cx } from '@/utils/cx';

import { DRAWER_RESERVE } from './strip';

/**
 * The notice reads the cache rather than being told about it. It subscribes to
 * the same four keys `DashboardGate` waits on and decides for itself, which is
 * what leaves the gate answering one question — whether there is data.
 *
 * Only those four reach it. `GET /me` on boot is data rather than a failure —
 * a `401` there means nobody is signed in, and anything else is worded next to
 * the sign-in form — and the stream's own heartbeat is a question the stream
 * asks itself, whose answer is on the marker.
 */
export function RequestFailureNotice() {
  const { write, dismissedAt, dismiss } = useRequestFailures();

  const queries = useQueries({
    queries: [
      applicationsQuery,
      categoriesQuery,
      staffMembersQuery,
      stateChangesQuery,
    ],
  });

  /**
   * A read that failed *with data already in the cache*. Without data there is
   * nothing to leave stale and nothing to unmount, so that one is the gate's
   * panel and not this.
   */
  const stale = queries.filter(
    (query) =>
      query.data !== undefined &&
      query.isError &&
      !isUnauthenticated(query.error) &&
      query.errorUpdatedAt > dismissedAt,
  );

  const staleAt = Math.max(0, ...stale.map((query) => query.errorUpdatedAt));
  const failedWrite = write !== null && write.at > dismissedAt ? write : null;

  if (failedWrite !== null && failedWrite.at >= staleAt) {
    return (
      <Notice onDismiss={dismiss}>
        {errorMessage(problemCode(failedWrite.failure))}
      </Notice>
    );
  }

  if (stale.length > 0) {
    return (
      <Notice
        onDismiss={dismiss}
        onRetry={() => {
          for (const query of stale) {
            void query.refetch();
          }
        }}
      >
        {de.dashboard.updateFailed}
      </Notice>
    );
  }

  return null;
}

/**
 * Two rows — the sentence, then the buttons beneath it at the left — because
 * an open `ApplicationDrawer` lies over the right end of the strip and would
 * swallow them there (issue #64). Along the way it stops the buttons' position
 * depending on how long the sentence is, and it turns the corner `XClose` into
 * a labelled button: `dismissFailure` is a visible label now rather than an
 * `aria-label`.
 *
 * The *box* keeps the full width of `main` and lets its right end run under
 * the drawer, which is what issue #64 asks for. The *contents* do not:
 * `DRAWER_RESERVE` sits inside the border, so the sentence wraps before the
 * drawer's column rather than being cut mid-word there, and the buttons wrap
 * onto their own lines when what is left will not hold both — which is what
 * 1024px needs, where only 189px stands clear.
 */
function Notice({
  children,
  onRetry,
  onDismiss,
}: {
  children: ReactNode;
  onRetry?: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="border-utility-red-200 bg-bg-error-primary rounded-lg border px-3.5 py-3">
      <div className={cx('flex flex-col items-start gap-2', DRAWER_RESERVE)}>
        <p role="alert" className="text-text-error-primary text-sm">
          {children}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          {onRetry !== undefined && (
            <Button size="sm" color="secondary" onClick={onRetry}>
              {de.dashboard.retry}
            </Button>
          )}

          <Button size="sm" color="tertiary" onClick={onDismiss}>
            {de.dashboard.dismissFailure}
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Remembers the last failed write, for the notice above and for every mutation
 * below. It wraps the dashboard rather than the whole application: the sign-in
 * screen words its own rejection next to the form.
 *
 * One failure, not a list. Five discards that all failed are one thing that
 * went wrong, and five identical sentences would say it five times.
 */
export function RequestFailures({ children }: { children: ReactNode }) {
  const [write, setWrite] = useState<RequestFailuresValue['write']>(null);
  const [dismissedAt, setDismissedAt] = useState(0);

  const report = useCallback((raised: unknown) => {
    if (isUnauthenticated(raised)) {
      return;
    }

    setWrite({ failure: raised, at: Date.now() });
  }, []);

  /**
   * Dismissing clears the write and hides every failure older than this
   * moment, the stale list's included: a query keeps its error until it
   * succeeds, so there is nothing to clear there — only something to stop
   * reading.
   */
  const dismiss = useCallback(() => {
    setWrite(null);
    setDismissedAt(Date.now());
  }, []);

  const value = useMemo<RequestFailuresValue>(
    () => ({ write, dismissedAt, report, dismiss }),
    [write, dismissedAt, report, dismiss],
  );

  return (
    <RequestFailuresContext.Provider value={value}>
      {children}
    </RequestFailuresContext.Provider>
  );
}
