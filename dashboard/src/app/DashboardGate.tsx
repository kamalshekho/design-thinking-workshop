/**
 * Loading and failure, answered once for the whole dashboard (ADR-0006).
 *
 * The gate sits between `AppShell` and the screen and subscribes to the same
 * four cache entries every screen below it reads. Its real payoff is
 * underneath: no container and no screen handles `Application[] | undefined`,
 * and no screen test writes the case where the data has not arrived.
 *
 * All four are waited on together rather than screen by screen. A row shows a
 * Category's name and an Owner's initials, so a list that arrives before
 * either would render Applications whose Category reads as missing and whose
 * Zuständigkeit column is empty — three staggered half-screens instead of one
 * wait.
 *
 * A failure offers a retry rather than only naming itself: the likely cause
 * is a backend that is not up yet or a request that was dropped, and both are
 * fixed by asking again.
 *
 * **An expired Sign-in is not one of them.** It is answered by the cover over
 * the whole dashboard (`SignInCover`), and this gate has to stay out of the
 * way while that happens: the panel below would unmount every screen under it
 * — the open drawer and the note typed into it included — which is the exact
 * work the cover exists to keep. So a `401` is skipped here, and the children
 * stay mounted behind the cover. It reaches this gate at all because a write
 * refused by the expired Sign-in invalidates the list on its way out
 * (`queries/optimistic.ts`), and the refetch is refused too.
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

  if (queries.some((query) => query.isPending)) {
    return <LoadingPanel />;
  }

  const failed = queries.filter(
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

  return children;
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
