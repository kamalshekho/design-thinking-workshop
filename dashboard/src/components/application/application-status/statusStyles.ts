/**
 * How an Application's Status looks, in one place: the table renders it as a
 * dot badge in a row, the drawer as a dot on the `select` and on a meta chip.
 * Both used to carry their own copy of the same six-colour map, so a palette
 * change had to be made twice to keep a row and its drawer agreeing.
 *
 * These are presentation tokens, not domain rules — the Status flow itself
 * lives in `domain/application.ts` and the German labels in `content/de.ts`.
 */

import type { BadgeColor } from '@/components/base/badges/badges';
import type { ApplicationStatus } from '@/domain/application';

/** One `BadgeWithDot` colour per Status, the restrained palette the list uses. */
export const STATUS_BADGE_COLORS: Record<
  ApplicationStatus,
  BadgeColor<'pill-color'>
> = {
  NEW: 'brand',
  IN_REVIEW: 'warning',
  INTRO_BOOKED: 'blue',
  ACTIVE: 'success',
  WAITLISTED: 'gray',
  DECLINED: 'error',
};

/**
 * The badge stripped back to a dot plus plain text: no fill, no ring, no
 * padding, and the label in a neutral rather than the status colour. Only the
 * dot carries colour, so a column of statuses reads as data instead of as six
 * competing highlights. The token is semantic, so a dark theme would flip the
 * label without touching this file.
 */
export const PLAIN_STATUS_BADGE_CLASSNAME =
  'gap-2 bg-transparent px-0 py-0 text-sm font-normal text-secondary ring-0';

/**
 * The same six dot colours as `Dot`'s `currentColor`, for the places that need
 * the dot without the badge around it — the drawer's Status control, where the
 * dot sits inside a `select` and the label is the browser's own option text.
 */
export const STATUS_DOT_CLASSNAME: Record<ApplicationStatus, string> = {
  NEW: 'text-utility-brand-500',
  IN_REVIEW: 'text-utility-yellow-500',
  INTRO_BOOKED: 'text-utility-blue-500',
  ACTIVE: 'text-utility-green-500',
  WAITLISTED: 'text-utility-neutral-500',
  DECLINED: 'text-utility-red-500',
};
