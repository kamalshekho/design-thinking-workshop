/**
 * The visual shell: the Untitled UI sidebar and the screen it frames.
 *
 * The sidebar is copied from the clone (`README.md` records which files, and
 * `THIRD_PARTY_LICENSES` the licence). Its three main items are the screens
 * issue #10 named, and all three have a screen behind them. The links carry
 * fragments and the caller says which one is current.
 *
 * Aussortiert — the fourth screen, the discarded Applications (`A16`) — sits
 * in the sidebar's footer slot rather than among the three: it is where a
 * Staff member goes to undo something, not one of the places the work
 * happens, and keeping it out of the main list also keeps the one screen that
 * can erase an Application away from the three that cannot.
 *
 * The shell is also where the live stream is opened, and the one place it can
 * be: it is mounted for as long as a Staff member is signed in, so switching
 * screens does not drop and reopen the connection, and it is not mounted at
 * all while the sign-in screen is up, when there is no Sign-in to
 * authenticate the stream with (ADR-0006).
 */

import { Archive, BarChartSquare02, Inbox01, Tag01 } from '@untitledui/icons';
import type { ReactNode } from 'react';

import type { NavItemType } from '@/components/application/app-navigation/config';
import {
  SIDEBAR_GUTTER,
  SidebarNavigationSimple,
} from '@/components/application/app-navigation/sidebar-navigation/sidebar-simple';
import { de } from '@/content/de';
import type { StaffMember } from '@/domain/staffMember';
import { useApplicationStream } from '@/queries/useApplicationStream';

import { StreamMarker } from './StreamMarker';

export type Screen = 'overview' | 'applications' | 'categories' | 'discarded';

const navItems: (NavItemType & { id: Screen })[] = [
  {
    id: 'overview',
    label: de.navigation.overview,
    href: '#overview',
    icon: BarChartSquare02,
  },
  {
    id: 'applications',
    label: de.navigation.applications,
    href: '#applications',
    icon: Inbox01,
  },
  {
    id: 'categories',
    label: de.navigation.categories,
    href: '#categories',
    icon: Tag01,
  },
];

const footerNavItems: (NavItemType & { id: Screen })[] = [
  {
    id: 'discarded',
    label: de.navigation.discarded,
    href: '#discarded',
    icon: Archive,
  },
];

type AppShellProps = {
  current: Screen;
  /** The signed-in Staff member, shown in the sidebar's account card. */
  account: StaffMember;
  /** Ends the session; `App` then renders `LoginScreen` again. */
  onSignOut: () => void;
  children: ReactNode;
};

export function AppShell({
  current,
  account,
  onSignOut,
  children,
}: AppShellProps) {
  const { connected } = useApplicationStream();

  return (
    <div className="bg-primary text-primary flex min-h-screen flex-col lg:flex-row">
      <SidebarNavigationSimple
        activeUrl={`#${current}`}
        items={navItems}
        footerItems={footerNavItems}
        account={account}
        onSignOut={onSignOut}
      />

      {/*
        The inset is `SIDEBAR_GUTTER`, not a Tailwind step: the sidebar is
        fixed at that gutter and the spacer reserves gutter + width, so this
        padding is exactly the gap between the sidebar's right edge and the
        content. `px-8` made it 32px.
      */}
      <main
        style={{ paddingInline: SIDEBAR_GUTTER }}
        className="bg-bg-canvas flex min-w-0 flex-1 flex-col gap-3 py-6"
      >
        <StreamMarker connected={connected} />
        {children}
      </main>
    </div>
  );
}
