import type { QueryClient } from '@tanstack/react-query';
import { QueryClientProvider } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { de } from '@/content/de';
import type { StaffMember } from '@/domain/staffMember';
import { ApplicationsContainer } from '@/features/applications/ApplicationsContainer';
import { parseFiltersFromHash } from '@/features/applications/filterApplications';
import { LoginScreen } from '@/features/auth/LoginScreen';
import { CategoriesContainer } from '@/features/categories/CategoriesContainer';
import { DiscardedContainer } from '@/features/discarded/DiscardedContainer';
import { OverviewContainer } from '@/features/overview/OverviewContainer';
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
import { WriteFailures } from './WriteFailures';

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
 * `WriteFailures` wraps the shell rather than the screens below it: the
 * mutations that report a failure are under it, and so is the notice that
 * words it, which `AppShell` renders beside the stream marker. The sign-in
 * screen is outside it, because it words its own rejection next to the form.
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
    <WriteFailures>
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
    </WriteFailures>
  );
}

/**
 * The four screens, below the gate — which is what puts the four dashboard
 * requests below it too. They are mounted only while a Staff member is signed
 * in, so the sign-in screen does not fire four requests that can only answer
 * `401`.
 *
 * Each of them is a container rather than the screen itself (ADR-0006): the
 * container reads the cache and turns the screen's intents into requests, and
 * this file is back to routing. `useDashboardData` — one hook that held every
 * list and every write for all four — is gone; what replaced it is four files
 * that each answer for one screen, plus `useApplicationWrites` for the two
 * that share a list and a drawer.
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
  return (
    <>
      {current === 'overview' && (
        <OverviewContainer staffName={staffMember.name} now={now} />
      )}

      {current === 'applications' && (
        <ApplicationsContainer
          now={now}
          initialFilters={parseFiltersFromHash(window.location.hash)}
        />
      )}

      {current === 'categories' && <CategoriesContainer />}

      {current === 'discarded' && <DiscardedContainer now={now} />}
    </>
  );
}
