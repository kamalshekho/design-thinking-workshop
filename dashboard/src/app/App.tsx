import type { QueryClient } from '@tanstack/react-query';
import { QueryClientProvider } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { de } from '@/content/de';
import type { StaffMember } from '@/domain/staffMember';
import { ApplicationsScreen } from '@/features/applications/ApplicationsScreen';
import { parseFiltersFromHash } from '@/features/applications/filterApplications';
import { LoginScreen } from '@/features/auth/LoginScreen';
import { CategoriesScreen } from '@/features/categories/CategoriesScreen';
import { DiscardedApplicationsScreen } from '@/features/discarded/DiscardedApplicationsScreen';
import { OverviewScreen } from '@/features/overview/OverviewScreen';
import { createQueryClient } from '@/queries/queryClient';
import {
  useSignedInStaffMember,
  useSignIn,
  useSignOut,
} from '@/queries/session';

import type { Screen } from './AppShell';
import { AppShell } from './AppShell';
import { DashboardGate } from './DashboardGate';
import { useCurrentScreen } from './useCurrentScreen';
import { useDashboardData } from './useDashboardData';

type AppProps = {
  /** Injected so tests agree with the fixtures on one reference date. */
  now?: Date;
  /**
   * The cache, injected by a test that wants `retry: false` and `gcTime: 0`.
   * The browser gets one built by `createQueryClient`, held for the lifetime
   * of the application — a client rebuilt on a render would throw the list
   * away on every keystroke.
   */
  client?: QueryClient;
};

/**
 * The provider around everything, and nothing else. The dashboard's own
 * wiring is `Dashboard` below, which is inside the provider and can therefore
 * ask whether anyone is signed in.
 */
export function App({ now, client }: AppProps = {}) {
  const [queryClient] = useState(() => client ?? createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <Dashboard now={now} />
    </QueryClientProvider>
  );
}

/**
 * The sign-in gate, the shell, and which screen the sidebar's `#fragment`
 * currently points at.
 *
 * **Whether a Staff member is signed in is a request.** The Sign-in is an
 * `HttpOnly` cookie the dashboard cannot read, so boot asks `GET /me`; there
 * is no `signedInAs` prop any more, and a reload lands back where the Staff
 * member was rather than on the sign-in screen. `null` means nobody is signed
 * in — an expired Sign-in mid-session is the same answer, and covering the
 * screens with the sign-in form without losing typed work is issue #40.
 *
 * The data every screen reads comes from `useDashboardData` and is handed
 * down, so no screen holds a list of its own; what comes back up is an intent
 * — which Application, which field — and this is where it becomes a change to
 * the cache. Issue #38 turns each of those into a request and moves the
 * wiring into a container per screen (ADR-0006).
 */
function Dashboard({ now }: { now?: Date }) {
  const current = useCurrentScreen();
  const referenceDate = useMemo(() => now ?? new Date(), [now]);

  const session = useSignedInStaffMember();
  const signIn = useSignIn();
  const signOut = useSignOut();

  if (session.isPending) {
    return (
      <main className="bg-primary text-primary flex min-h-dvh items-center justify-center">
        <p role="status" className="text-tertiary text-sm">
          {de.auth.checking}
        </p>
      </main>
    );
  }

  const staffMember: StaffMember | null = session.data ?? null;

  if (staffMember === null) {
    return (
      <LoginScreen
        onSignIn={signIn.mutate}
        /*
         * A failed `GET /me` that was not a `401` is shown here too: the
         * Staff member's only move is still to sign in, and hiding the reason
         * would leave a form that fails for no stated cause.
         */
        failure={signIn.error ?? session.error}
        isSubmitting={signIn.isPending}
      />
    );
  }

  return (
    <AppShell
      current={current}
      account={staffMember}
      onSignOut={() => {
        signOut.mutate();
      }}
    >
      <DashboardGate>
        <Screens
          current={current}
          staffMember={staffMember}
          now={referenceDate}
        />
      </DashboardGate>
    </AppShell>
  );
}

/**
 * The four screens, below the gate — which is what puts the four dashboard
 * requests below it too. They are mounted only while a Staff member is signed
 * in, so the sign-in screen does not fire four requests that can only answer
 * `401`.
 */
function Screens({
  current,
  staffMember,
  now,
}: {
  current: Screen;
  staffMember: StaffMember;
  now: Date;
}) {
  const data = useDashboardData(now);

  return (
    <>
      {current === 'overview' && (
        <OverviewScreen
          staffName={staffMember.name}
          applications={data.applications}
          onEdit={data.editApplication}
          onDiscard={data.discard}
          categories={data.categories}
          owners={data.owners}
          now={now}
        />
      )}

      {current === 'applications' && (
        <ApplicationsScreen
          now={now}
          applications={data.applications}
          onEdit={data.editApplication}
          onDiscard={data.discard}
          categories={data.categories}
          owners={data.owners}
          initialFilters={parseFiltersFromHash(window.location.hash)}
        />
      )}

      {current === 'categories' && (
        <CategoriesScreen
          categories={data.categories}
          onCreate={data.createCategory}
          onEdit={data.editCategory}
          onSetActive={data.setCategoryActive}
          onDelete={data.deleteCategory}
          onReorder={data.reorderCategories}
          applications={data.applications}
        />
      )}

      {current === 'discarded' && (
        <DiscardedApplicationsScreen
          applications={data.discardedApplications}
          onRestore={data.restore}
          onErase={data.erase}
          categories={data.categories}
          owners={data.owners}
          now={now}
        />
      )}
    </>
  );
}
