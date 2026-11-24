/**
 * The visual shell: the Untitled UI sidebar, the strip with the stream marker
 * and the last failed request, and the screen it frames. What the sidebar
 * holds and why the strip sits above the screens: `README.md`, "The copied
 * components", "Aussortiert" and "How the dashboard talks to the backend".
 *
 * The shell opens the live stream because it stays mounted while a Staff
 * member is signed in: switching screens keeps the connection, and the
 * sign-in screen, with no Sign-in to authenticate the stream, opens none
 * (ADR-0006). While the cover is up, `signInExpired` stands in for unmounting:
 * it closes the stream and makes the shell `inert`, so a click under the
 * cover cannot send a write that would only be refused.
 */

import { Archive, BarChartSquare02, Inbox01, Tag01 } from '@untitledui/icons';
import type { CSSProperties, ReactNode } from 'react';

import type { NavItemType } from '@/components/application/app-navigation/config';
import {
  SIDEBAR_GUTTER,
  SidebarNavigationSimple,
} from '@/components/application/app-navigation/sidebar-navigation/sidebar-simple';
import { de } from '@/content/de';
import type { StaffMember } from '@/domain/staffMember';
import { useApplicationStream } from '@/queries/useApplicationStream';

import { RequestFailureNotice } from './RequestFailures';
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
  /** Ends the Sign-in; `App` then renders `LoginScreen` again. */
  onSignOut: () => void;
  /** The Sign-in ran out and `App` has put the cover over this shell. */
  signInExpired?: boolean;
  children: ReactNode;
};

export function AppShell({
  current,
  account,
  onSignOut,
  signInExpired = false,
  children,
}: AppShellProps) {
  const { connected } = useApplicationStream({ enabled: !signInExpired });

  return (
    <div
      inert={signInExpired}
      className="bg-primary text-primary flex min-h-screen flex-col lg:flex-row"
    >
      <SidebarNavigationSimple
        activeUrl={`#${current}`}
        items={navItems}
        footerItems={footerNavItems}
        account={account}
        onSignOut={onSignOut}
      />

      {/*
        From 640 px the inset is `SIDEBAR_GUTTER`, not a Tailwind step: the
        sidebar is fixed at that gutter and the spacer reserves gutter + width,
        so this padding is exactly the gap between the sidebar's right edge and
        the content. `px-8` made it 32px. Below 640 px it is 16 px, because 30
        px on each side of a 360 px phone leaves a sixth of the width unused
        (issue #109).
      */}
      <main
        style={{ '--gutter': `${String(SIDEBAR_GUTTER)}px` } as CSSProperties}
        className="bg-bg-canvas flex min-w-0 flex-1 flex-col gap-3 px-4 py-6 sm:px-(--gutter)"
      >
        {/*
         * The strip. Whatever is added here reads from the left and keeps
         * `DRAWER_RESERVE` on its contents: `ApplicationDrawer` is an `aside`
         * with no scrim, so it lies over the right end while blocking
         * nothing, and a panel that blocks nothing may not eat a click on a
         * control it covers, nor cut a sentence that has to be read
         * (issue #64). A bordered box may still span the full width — only
         * what is read or clicked has to stay out of that column.
         *
         * The strip is never told that a drawer is open. The reserve is
         * unconditional, which is what keeps anything here from moving when
         * one opens, and it costs nothing while none is there because
         * everything is left-aligned.
         *
         * The rule stops at the modal overlays: `CategoryDialog`,
         * `DiscardSelectedDialog` and `SignInCover` cover this strip on
         * purpose. Below `sm` the drawer is `w-full` and no reserve reaches
         * anything — a known hole, since at that width the drawer is a modal
         * in all but the attribute.
         */}
        <StreamMarker connected={connected} />
        <RequestFailureNotice />
        {children}
      </main>
    </div>
  );
}
