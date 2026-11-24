/**
 * Clone path: `utils/cx.ts`. Extended with the dashboard's custom `@theme`
 * font-size tokens and hairline ring/outline/stroke utilities (#133) so
 * `tailwind-merge` does not mistake them for colours.
 */

import { extendTailwindMerge } from 'tailwind-merge';

const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: [
        'display-xs',
        'display-sm',
        'display-md',
        'display-lg',
        'display-xl',
        'display-2xl',
        '2xs',
        'caption',
        'body-sm',
      ],
      radius: ['inner', 'surface'],
      spacing: [
        'control',
        'hairline',
        'avatar-border',
        'sidebar-header',
        'sidebar-toggle',
        'filter-select',
        'search',
        'search-max',
        'popover',
        'popover-offset',
        'popover-max',
        'drawer',
        'drawer-lg',
        'header-copy',
        'empty-copy',
        'category-copy',
        'half-viewport',
        'dialog-max',
        'safe-bottom',
      ],
    },
    classGroups: {
      'ring-w': [{ ring: ['hairline'] }],
      'outline-w': [{ outline: ['hairline'] }],
      'outline-offset': [{ 'outline-offset': ['hairline'] }],
      'stroke-w': [{ stroke: ['icon-thin', 'icon-medium', 'icon-bold'] }],
    },
  },
});

/**
 * This function is a wrapper around the twMerge function.
 * It is used to merge the classes inside style objects.
 */
export const cx = twMerge;

/**
 * This function does nothing besides helping us to be able to
 * sort the classes inside style objects which is not supported
 * by the Tailwind IntelliSense by default.
 */
export function sortCx<
  T extends Record<
    string,
    | string
    | number
    | Record<string, string | number | Record<string, string | number>>
  >,
>(classes: T): T {
  return classes;
}
