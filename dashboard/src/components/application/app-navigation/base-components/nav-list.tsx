import type {
  NavItemDividerType,
  NavItemType,
} from '@/components/application/app-navigation/config';
import { cx } from '@/utils/cx';

import { NavItemBase } from './nav-item';

/**
 * Copied from the Untitled UI clone
 * (`components/application/app-navigation/base-components/nav-list.tsx`),
 * unchanged apart from the import paths.
 */

interface NavListProps {
  /** URL of the currently active item. */
  activeUrl?: string;
  /** Additional CSS classes to apply to the list. */
  className?: string;
  /** Whether the desktop sidebar shows icons without visible labels. */
  isCollapsed?: boolean;
  /** List of items to display. */
  items: (NavItemType | NavItemDividerType)[];
}

export const NavList = ({
  activeUrl,
  items,
  className,
  isCollapsed = false,
}: NavListProps) => {
  const activeItem = items.find(
    (item) =>
      item.href === activeUrl ||
      item.items?.some((subItem) => subItem.href === activeUrl),
  );

  return (
    <ul className={cx('flex flex-col px-4 pt-5', className)}>
      {items.map((item, index) => {
        if (item.divider) {
          return (
            <li key={index} className="w-full px-0.5 py-2">
              <hr className="bg-border-secondary h-px w-full border-none" />
            </li>
          );
        }

        if (item.items?.length) {
          return (
            <details
              key={item.label}
              open={activeItem?.href === item.href}
              className="appearance-none py-0.25"
            >
              <NavItemBase
                href={item.href}
                badge={item.badge}
                icon={item.icon}
                isCollapsed={isCollapsed}
                type="collapsible"
              >
                {item.label}
              </NavItemBase>

              <dd>
                <ul className="pb-1">
                  {item.items.map((childItem) => (
                    <li key={childItem.label} className="py-0.25">
                      <NavItemBase
                        href={childItem.href}
                        badge={childItem.badge}
                        type="collapsible-child"
                        isCollapsed={isCollapsed}
                        current={activeUrl === childItem.href}
                      >
                        {childItem.label}
                      </NavItemBase>
                    </li>
                  ))}
                </ul>
              </dd>
            </details>
          );
        }

        return (
          <li key={item.label} className="py-px">
            <NavItemBase
              type="link"
              badge={item.badge}
              icon={item.icon}
              isCollapsed={isCollapsed}
              href={item.href}
              current={activeUrl === item.href}
            >
              {item.label}
            </NavItemBase>
          </li>
        );
      })}
    </ul>
  );
};
