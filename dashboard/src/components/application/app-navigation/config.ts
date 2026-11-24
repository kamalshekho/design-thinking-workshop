/**
 * Clone path: `components/application/app-navigation/config.ts`.
 *
 * Prop comments that only restate the prop name are dropped.
 */

import type { FC, ReactNode } from 'react';

export type NavItemType = {
  label: string;
  href?: string;
  icon?: FC<{ className?: string }>;
  badge?: ReactNode;
  items?: {
    label: string;
    href: string;
    icon?: FC<{ className?: string }>;
    badge?: ReactNode;
  }[];
  divider?: boolean;
};

export type NavItemDividerType = Omit<
  NavItemType,
  'icon' | 'label' | 'divider'
> & {
  label?: string;
  divider: true;
};
