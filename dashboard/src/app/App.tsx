import { useMemo, useState } from 'react';

import { useDashboardData } from '@/data/useDashboardData';
import type { StaffMember } from '@/domain/staffMember';
import { ApplicationsScreen } from '@/features/applications/ApplicationsScreen';
import { parseFiltersFromHash } from '@/features/applications/filterApplications';
import { LoginScreen } from '@/features/auth/LoginScreen';
import { CategoriesScreen } from '@/features/categories/CategoriesScreen';
import { DiscardedApplicationsScreen } from '@/features/discarded/DiscardedApplicationsScreen';
import { OverviewScreen } from '@/features/overview/OverviewScreen';

import { AppShell } from './AppShell';
import { useCurrentScreen } from './useCurrentScreen';

type AppProps = {
  /** Injected so tests agree with the mock data on one reference date. */
  now?: Date;
  /**
   * The Staff member the session starts with. `null` — the default, and what
   * the browser gets — opens `LoginScreen`; a test about a dashboard screen
   * passes one in rather than signing in first.
   */
  signedInAs?: StaffMember | null;
};

/**
 * The application: the sign-in gate, the shell, and which screen the sidebar's
 * `#fragment` currently points at. The data every screen reads comes from
 * `useDashboardData` and is handed down, so no screen holds a list of its own.
 */
export function App({ now, signedInAs = null }: AppProps = {}) {
  const current = useCurrentScreen();
  const referenceDate = useMemo(() => now ?? new Date(), [now]);

  /**
   * The session, held in memory only: nothing is persisted, so a reload lands
   * back on the sign-in screen. There is no token to keep and no backend to
   * validate one against yet (`A16`, issue #16).
   */
  const [staffMember, setStaffMember] = useState<StaffMember | null>(
    signedInAs,
  );

  const data = useDashboardData(referenceDate);

  if (staffMember === null) {
    return <LoginScreen onSignIn={setStaffMember} />;
  }

  return (
    <AppShell
      current={current}
      account={staffMember}
      onSignOut={() => {
        setStaffMember(null);
      }}
    >
      {current === 'overview' && (
        <OverviewScreen
          staffName={staffMember.name}
          applications={data.applications}
          onApplicationsChange={data.setApplications}
          onDiscard={data.discard}
          categories={data.categories}
          owners={data.owners}
          now={referenceDate}
        />
      )}

      {current === 'applications' && (
        <ApplicationsScreen
          now={referenceDate}
          applications={data.applications}
          onApplicationsChange={data.setApplications}
          onDiscard={data.discard}
          categories={data.categories}
          owners={data.owners}
          initialFilters={parseFiltersFromHash(window.location.hash)}
        />
      )}

      {current === 'categories' && (
        <CategoriesScreen
          categories={data.categories}
          onCategoriesChange={data.setCategories}
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
          now={referenceDate}
        />
      )}
    </AppShell>
  );
}
