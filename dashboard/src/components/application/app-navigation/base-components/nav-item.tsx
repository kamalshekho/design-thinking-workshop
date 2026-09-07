import { ChevronDown, Share04 } from '@untitledui/icons';
import type { FC, HTMLAttributes, MouseEventHandler, ReactNode } from 'react';
import { Link as AriaLink } from 'react-aria-components';

import { cx, sortCx } from '@/utils/cx';

/**
 * Copied from the Untitled UI clone
 * (`components/application/app-navigation/base-components/nav-item.tsx`).
 *
 * One change: a string or number `badge` renders as a small pill here instead
 * of the clone's `Badge` component, which is 417 lines of colour and shape
 * variants that no screen in this application needs yet.
 */

const styles = sortCx({
  root: 'group relative flex h-10 w-full cursor-pointer items-center rounded-md bg-primary outline-focus-ring transition duration-100 ease-linear select-none hover:bg-primary_hover focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2',
  rootSelected: 'bg-utility-brand-50 hover:bg-utility-brand-50',
});

interface NavItemBaseProps {
  /** URL to navigate to when the nav item is clicked. */
  href?: string;
  /** Type of the nav item. */
  type: 'link' | 'collapsible' | 'collapsible-child';
  /** Icon component to display. */
  icon?: FC<HTMLAttributes<HTMLOrSVGElement>>;
  /** Badge to display. */
  badge?: ReactNode;
  /** Whether the nav item is currently active. */
  current?: boolean;
  /** Whether to truncate the label text. */
  truncate?: boolean;
  /** Handler for click events. */
  onClick?: MouseEventHandler;
  /** Whether the desktop sidebar shows icons without visible labels. */
  isCollapsed?: boolean;
  /** Content to display. */
  children?: ReactNode;
}

export const NavItemBase = ({
  current,
  type,
  badge,
  href,
  icon: Icon,
  children,
  truncate = true,
  onClick,
  isCollapsed = false,
}: NavItemBaseProps) => {
  const iconElement = Icon && (
    <Icon
      aria-hidden="true"
      className={cx(
        'mr-3 size-4.5 shrink-0 transition-[margin] duration-200 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none',
        isCollapsed && 'lg:mr-0',
        current
          ? 'text-fuut-purple'
          : 'text-fg-quaternary group-hover/item:text-fg-quaternary_hover',
      )}
    />
  );

  const badgeElement =
    typeof badge === 'string' || typeof badge === 'number' ? (
      <span className="bg-secondary text-tertiary ml-3 rounded-full px-2 py-0.5 text-xs font-medium">
        {badge}
      </span>
    ) : (
      badge
    );

  const labelElement = (
    <span
      className={cx(
        'max-w-52 min-w-0 overflow-hidden text-sm font-medium whitespace-nowrap opacity-100 transition-[max-width,opacity,clip-path] duration-200 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)] [clip-path:inset(0_0_0_0)] motion-reduce:transition-none',
        truncate && 'truncate',
        isCollapsed &&
          'lg:max-w-0 lg:opacity-0 lg:[clip-path:inset(0_100%_0_0)]',
        current
          ? 'text-primary font-semibold'
          : 'text-secondary group-hover/item:text-secondary_hover',
      )}
    >
      {children}
    </span>
  );

  const isExternal = href?.startsWith('http') ?? false;
  const externalIcon = isExternal && (
    <Share04 className="text-fg-quaternary size-4 stroke-[2.5px]" />
  );

  if (type === 'collapsible') {
    return (
      <summary
        className={cx('p-2', styles.root, current && styles.rootSelected)}
        onClick={onClick}
      >
        {iconElement}
        {labelElement}
        {badgeElement}

        <ChevronDown
          aria-hidden="true"
          className="text-fg-quaternary ml-3 size-4 shrink-0 stroke-[2.5px] in-open:-scale-y-100"
        />
      </summary>
    );
  }

  if (type === 'collapsible-child') {
    return (
      <AriaLink
        href={href}
        target={isExternal ? '_blank' : '_self'}
        rel="noopener noreferrer"
        className={cx(
          'py-2 pr-3 pl-10',
          styles.root,
          current && styles.rootSelected,
        )}
        onClick={onClick}
        aria-current={current ? 'page' : undefined}
      >
        {labelElement}
        {externalIcon}
        {badgeElement}
      </AriaLink>
    );
  }

  return (
    <AriaLink
      href={href}
      target={isExternal ? '_blank' : '_self'}
      rel="noopener noreferrer"
      className={cx(
        'group/item p-2',
        styles.root,
        current && styles.rootSelected,
      )}
      onClick={onClick}
      aria-current={current ? 'page' : undefined}
    >
      {iconElement}
      {labelElement}
      {externalIcon}
      {badgeElement}
    </AriaLink>
  );
};
