import type { QueryClient } from '@tanstack/react-query';
import { QueryClientProvider } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { de } from '@/content/de';
import { NO_SIGN_IN } from '@/domain/signIn';
import type { StaffMember } from '@/domain/staffMember';
import { ApplicationsContainer } from '@/features/applications/ApplicationsContainer';
import { parseFiltersFromHash } from '@/features/applications/filterApplications';
import { LoginScreen } from '@/features/auth/LoginScreen';
import { CategoriesContainer } from '@/features/categories/CategoriesContainer';
import { DiscardedContainer } from '@/features/discarded/DiscardedContainer';
import { OverviewContainer } from '@/features/overview/OverviewContainer';
import { createQueryClient } from '@/queries/queryClient';
import { useCurrentSignIn, useSignIn, useSignOut } from '@/queries/session';

import type { Screen } from './AppShell';
import { AppShell } from './AppShell';
import { DashboardGate } from './DashboardGate';
import { SignInCover } from './SignInCover';
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
 * member was rather than on the sign-in screen.
 *
 * **Nobody signed in and a Sign-in that ran out are different answers**, and
 * this is the file where the difference shows (`domain/signIn.ts`). `none` is
 * the sign-in screen, with nothing behind it. `expired` is the same form over
 * a dashboard that is still mounted: the shell, the containers, the open
 * drawer and the note typed into it stay exactly where they were, and signing
 * in again reveals them rather than rebuilding them. Swapping in `LoginScreen`
 * would unmount the lot, which is precisely the work the cover exists to keep.
 *
 * `WriteFailures` wraps both, so a write refused by the expired Sign-in has
 * somewhere to report to while the cover comes up — the notice itself ignores
 * that one code, since the cover already says what happened. The sign-in
 * screen proper is outside it, because it words its own rejection next to the
 * form.
 */
function Dashboard({ now }: { now?: Date }) {
  const current = useCurrentScreen();
  const referenceDate = useMemo(() => now ?? new Date(), [now]);

  const query = useCurrentSignIn();
  const signInRequest = useSignIn();
  const signOutRequest = useSignOut();

  if (query.isPending) {
    return (
      <main className="bg-primary text-primary flex min-h-dvh items-center justify-center">
        <p role="status" className="text-tertiary text-sm">
          {de.auth.checking}
        </p>
      </main>
    );
  }

  const signIn = query.data ?? NO_SIGN_IN;

  if (signIn.kind === 'none') {
    return (
      <LoginScreen
        onSignIn={signInRequest.mutate}
        /*
         * A failed `GET /me` that was not a `401` is shown here too: the
         * Staff member's only move is still to sign in, and hiding the reason
         * would leave a form that fails for no stated cause.
         */
        failure={signInRequest.error ?? query.error}
        isSubmitting={signInRequest.isPending}
      />
    );
  }

  /**
   * From here on there is a Staff member either way, and the only question is
   * whether their Sign-in still works. Both branches render the same shell —
   * the cover is a sibling of it rather than a replacement for it, which is
   * what keeps everything below `DashboardGate` mounted through an expiry.
   */
  const expired = signIn.kind === 'expired';
  const staffMember: StaffMember = signIn.staffMember;

  return (
    <WriteFailures>
      <AppShell
        current={current}
        account={staffMember}
        signInExpired={expired}
        onSignOut={() => {
          signOutRequest.mutate();
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

      {expired && (
        <SignInCover
          staffMember={staffMember}
          onSignIn={signInRequest.mutate}
          failure={signInRequest.error}
          isSubmitting={signInRequest.isPending}
        />
      )}
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
