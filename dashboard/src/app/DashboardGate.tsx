/**
 * Whether there is anything to show yet, answered once for the whole
 * dashboard. Where it sits, what it spares the screens, and why it asks
 * whether there is data rather than whether a fetch failed: `README.md`, "How
 * the dashboard talks to the backend".
 *
 * The four cache entries every screen reads are waited on together rather
 * than screen by screen. A row shows a Category's name and an Owner's
 * initials, so a list that arrives before either would render Applications
 * whose Category reads as missing and whose Zuständigkeit column is empty —
 * three staggered half-screens instead of one wait.
 *
 * A failure here offers a retry rather than only naming itself: the likely
 * cause is a backend that is not up yet or a request that was dropped, and
 * both are fixed by asking again.
 *
 * A `401` is skipped: the cover over the whole dashboard (`SignInCover`)
 * answers it, and this gate stays out of its way. It reaches the gate at all
 * because a write refused by the expired Sign-in invalidates the list on its
 * way out (`queries/optimistic.ts`), and the refetch is refused too.
 */

import { useQueries } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { isUnauthenticated } from '@/api/problem';
import { Button } from '@/components/base/buttons/button';
import { de } from '@/content/de';
import { applicationsQuery, stateChangesQuery } from '@/queries/applications';
import { categoriesQuery } from '@/queries/categories';
import { staffMembersQuery } from '@/queries/staffMembers';

type DashboardGateProps = {
  children: ReactNode;
};

export function DashboardGate({ children }: DashboardGateProps) {
  const queries = useQueries({
    queries: [
      applicationsQuery,
      categoriesQuery,
      staffMembersQuery,
      stateChangesQuery,
    ],
  });

  /**
   * A read that failed with data in the cache is not one of these: it has
   * something to show, and `RequestFailureNotice` says what happened over the
   * top of it.
   */
  const missing = queries.filter((query) => query.data === undefined);

  if (missing.length === 0) {
    return children;
  }

  const failed = missing.filter(
    (query) => query.isError && !isUnauthenticated(query.error),
  );

  if (failed.length > 0) {
    return (
      <FailurePanel
        onRetry={() => {
          for (const query of failed) {
            void query.refetch();
          }
        }}
      />
    );
  }

  return <LoadingPanel />;
}

/**
 * A sentence rather than a skeleton of the screen behind it. Which screen
 * that is depends on the sidebar's fragment, so a skeleton here would have to
 * know all four layouts to avoid promising the wrong one.
 */
function LoadingPanel() {
  return (
    <p role="status" className="text-tertiary py-12 text-center text-sm">
      {de.dashboard.loading}
    </p>
  );
}

function FailurePanel({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-12">
      <p role="alert" className="text-secondary text-sm">
        {de.dashboard.loadFailed}
      </p>
      <Button size="sm" color="secondary" onClick={onRetry}>
        {de.dashboard.retry}
      </Button>
    </div>
  );
}
