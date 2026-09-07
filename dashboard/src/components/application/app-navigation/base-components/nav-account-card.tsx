import {
  ChevronSelectorVertical,
  LogOut01,
  Settings01,
  User01,
} from '@untitledui/icons';
import type { FC } from 'react';
import {
  Button as AriaButton,
  Menu as AriaMenu,
  MenuItem as AriaMenuItem,
  MenuTrigger as AriaMenuTrigger,
  Popover as AriaPopover,
} from 'react-aria-components';

import { Avatar } from '@/components/base/avatar/avatar';
import { AvatarLabelGroup } from '@/components/base/avatar/avatar-label-group';
import { de } from '@/content/de';
import type { StaffMember } from '@/domain/staffMember';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { cx } from '@/utils/cx';
import { initialsOf } from '@/utils/initials';

/**
 * Copied from the Untitled UI clone
 * (`components/application/app-navigation/base-components/nav-account-card.tsx`),
 * with the account switcher removed: the clone's card lets a person hold
 * several accounts and add another, and this dashboard has one Staff member
 * signed in at a time.
 *
 * The menu is a React Aria `MenuTrigger` rather than the clone's `Dialog` plus
 * a hand-written arrow-key handler — it is the same library, and it carries
 * the keyboard behaviour the hand-written version reimplements.
 *
 * Its `Abmelden` item calls `onSignOut`, which ends the session and returns
 * the application to `LoginScreen` (`A16`). Profil ansehen and Einstellungen
 * have no screen behind them yet and still do nothing.
 */

const menuItems: {
  id: string;
  label: string;
  icon: FC<{ className?: string }>;
}[] = [
  { id: 'profile', label: de.account.viewProfile, icon: User01 },
  { id: 'settings', label: de.account.settings, icon: Settings01 },
  { id: 'sign-out', label: de.account.signOut, icon: LogOut01 },
];

export const NavAccountCard = ({
  account,
  avatarRounded,
  isCollapsed = false,
  onSignOut,
}: {
  account: StaffMember;
  avatarRounded?: boolean;
  /** Whether the desktop sidebar shows only the avatar. */
  isCollapsed?: boolean;
  /** Called when the Staff member picks Abmelden. */
  onSignOut?: () => void;
}) => {
  const isDesktop = useBreakpoint('lg');
  const initials = initialsOf(account.name);

  const menu = (
    <AriaPopover
      placement={isDesktop ? 'right bottom' : 'top right'}
      offset={8}
      className={({ isEntering, isExiting }) =>
        cx(
          'bg-primary ring-secondary w-66 origin-(--trigger-anchor-point) rounded-xl shadow-lg ring-1 outline-hidden will-change-transform',
          isEntering && 'popover-entering',
          isExiting && 'popover-exiting',
        )
      }
    >
      <AriaMenu
        onAction={(key) => {
          if (key === 'sign-out') {
            onSignOut?.();
          }
        }}
        className="flex flex-col gap-0.5 p-1.5 outline-hidden"
      >
        {menuItems.map((item) => (
          <AriaMenuItem
            key={item.id}
            id={item.id}
            className="text-secondary outline-focus-ring hover:bg-primary_hover hover:text-secondary_hover data-focused:bg-primary_hover data-focused:text-secondary_hover flex cursor-pointer items-center gap-2 rounded-md p-2 text-sm font-semibold select-none focus-visible:outline-2 focus-visible:-outline-offset-2"
          >
            <item.icon className="text-fg-quaternary size-4" />
            {item.label}
          </AriaMenuItem>
        ))}
      </AriaMenu>
    </AriaPopover>
  );

  if (isCollapsed) {
    return (
      <AriaMenuTrigger>
        <AriaButton
          aria-label={de.account.menu}
          className="outline-focus-ring hover:bg-primary_hover flex cursor-pointer items-center justify-center rounded-full p-1 focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <Avatar
            border
            rounded={avatarRounded}
            size="sm"
            src={account.avatar}
            initials={initials}
          />
        </AriaButton>

        {menu}
      </AriaMenuTrigger>
    );
  }

  return (
    <div className="border-secondary relative flex items-center gap-2 border-t py-4 pr-6">
      <AvatarLabelGroup
        size="sm"
        src={account.avatar}
        initials={initials}
        title={account.name}
        subtitle={account.email}
        rounded={avatarRounded}
      />

      <AriaMenuTrigger>
        <AriaButton
          aria-label={de.account.menu}
          className="text-fg-quaternary outline-focus-ring hover:bg-primary_hover hover:text-fg-quaternary_hover data-pressed:bg-primary_hover data-pressed:text-fg-quaternary_hover absolute top-4 right-0 flex cursor-pointer items-center justify-center rounded-md p-1.5 transition duration-100 ease-linear focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <ChevronSelectorVertical className="size-4 shrink-0 stroke-[2.25px]" />
        </AriaButton>
        {menu}
      </AriaMenuTrigger>
    </div>
  );
};
