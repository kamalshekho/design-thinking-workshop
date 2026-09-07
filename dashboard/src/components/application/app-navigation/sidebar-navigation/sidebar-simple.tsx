import { Menu01 } from '@untitledui/icons';
import { type CSSProperties, useState } from 'react';
import { Button as AriaButton } from 'react-aria-components';

import { MobileNavigationHeader } from '@/components/application/app-navigation/base-components/mobile-header';
import { NavAccountCard } from '@/components/application/app-navigation/base-components/nav-account-card';
import { NavItemBase } from '@/components/application/app-navigation/base-components/nav-item';
import { NavList } from '@/components/application/app-navigation/base-components/nav-list';
import type { NavItemType } from '@/components/application/app-navigation/config';
import { AssociationWordmark } from '@/components/foundations/logo/association-wordmark';
import { de } from '@/content/de';
import type { StaffMember } from '@/domain/staffMember';
import { cx } from '@/utils/cx';

/**
 * Copied from the Untitled UI clone
 * (`components/application/app-navigation/sidebar-navigation/sidebar-simple.tsx`).
 *
 * Two changes. The association wordmark stands in for `UntitledLogo`. The
 * clone's two search inputs are gone: the Anfragen screen has its own filter
 * bar, and a second search box that searches nothing is dead UI.
 */

interface SidebarNavigationProps {
  /** URL of the currently active item. */
  activeUrl?: string;
  /** List of items to display. */
  items: NavItemType[];
  /** List of footer items to display. */
  footerItems?: NavItemType[];
  /** The signed-in Staff member shown in the account card. */
  account?: StaffMember;
  /** Passed to the account card's Abmelden item. */
  onSignOut?: () => void;
  /** Whether to hide the right side border. */
  hideBorder?: boolean;
  /** Additional CSS classes to apply to the sidebar. */
  className?: string;
}

const MAIN_SIDEBAR_WIDTH = 280;
const SLIM_SIDEBAR_WIDTH = 72;
/**
 * Gap between the viewport's left edge and the fixed sidebar, matching the
 * page's 30px margin rhythm. Exported because `AppShell` uses the same value
 * for the screen's own inset — that is what puts the content's left edge
 * exactly this far from the sidebar's right edge rather than a Tailwind step
 * away from it.
 */
export const SIDEBAR_GUTTER = 30;

export const SidebarNavigationSimple = ({
  activeUrl,
  items,
  footerItems = [],
  account,
  onSignOut,
  hideBorder = false,
  className,
}: SidebarNavigationProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const sidebarWidth = isCollapsed ? SLIM_SIDEBAR_WIDTH : MAIN_SIDEBAR_WIDTH;

  const content = (
    <nav
      aria-label={de.navigation.label}
      style={{ '--width': `${String(sidebarWidth)}px` } as CSSProperties}
      className={cx(
        'bg-primary flex h-full w-full max-w-full flex-col justify-between overflow-auto pt-4 motion-reduce:transition-none lg:w-(--width) lg:pt-5 lg:transition-[width]',
        !hideBorder && 'border-secondary md:border-r',
        'duration-200 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)]',
        className,
      )}
    >
      <div
        className={cx(
          'border-secondary relative flex min-h-[52px] items-center overflow-hidden border-b pr-4 pb-4 pl-3 lg:pb-5',
        )}
      >
        <AriaButton
          aria-label={
            isCollapsed ? de.navigation.expand : de.navigation.collapse
          }
          onPress={() => {
            setIsCollapsed((collapsed) => !collapsed);
          }}
          className={cx(
            'peer/toggle group text-fg-quaternary outline-focus-ring hover:bg-primary_hover absolute top-4 left-[calc(100%-30px)] z-10 hidden size-9 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md transition-[left,transform] duration-200 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)] focus-visible:outline-2 focus-visible:outline-offset-2 motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100 lg:flex',
            isCollapsed && 'lg:left-1/2',
          )}
        >
          <Menu01
            aria-hidden="true"
            className={cx(
              'size-4.5 transition-[opacity,transform] duration-200 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none',
              isCollapsed &&
                'lg:scale-90 lg:opacity-0 lg:group-hover:scale-100 lg:group-hover:opacity-100 lg:group-focus-visible:scale-100 lg:group-focus-visible:opacity-100',
            )}
          />
        </AriaButton>
        <span
          className={cx(
            'absolute top-0 left-6 transition-[left,transform,opacity] duration-200 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none',
            isCollapsed &&
              'lg:left-1/2 lg:-translate-x-1/2 lg:peer-hover/toggle:opacity-0 lg:peer-focus-visible/toggle:opacity-0',
          )}
        >
          <AssociationWordmark isCollapsed={isCollapsed} />
        </span>
      </div>

      <NavList activeUrl={activeUrl} items={items} isCollapsed={isCollapsed} />

      <div className={cx('mt-auto flex flex-col gap-3 px-4 py-4 lg:py-5')}>
        {footerItems.length > 0 && (
          <ul className="flex flex-col">
            {footerItems.map((item) => (
              <li key={item.label} className="py-px">
                <NavItemBase
                  badge={item.badge}
                  icon={item.icon}
                  href={item.href}
                  isCollapsed={isCollapsed}
                  type="link"
                  current={item.href === activeUrl}
                >
                  {item.label}
                </NavItemBase>
              </li>
            ))}
          </ul>
        )}

        {account && (
          <NavAccountCard
            account={account}
            isCollapsed={isCollapsed}
            onSignOut={onSignOut}
          />
        )}
      </div>
    </nav>
  );

  return (
    <>
      <MobileNavigationHeader>{content}</MobileNavigationHeader>

      <div
        style={{ width: sidebarWidth, left: SIDEBAR_GUTTER }}
        className={cx(
          'hidden overflow-hidden transition-[width] motion-reduce:transition-none lg:fixed lg:inset-y-0 lg:flex',
          'duration-200 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)]',
        )}
      >
        {content}
      </div>

      <div
        style={{ paddingLeft: sidebarWidth + SIDEBAR_GUTTER }}
        className={cx(
          'invisible hidden transition-[padding] motion-reduce:transition-none lg:sticky lg:top-0 lg:bottom-0 lg:left-0 lg:block',
          'duration-200 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)]',
        )}
      />
    </>
  );
};
