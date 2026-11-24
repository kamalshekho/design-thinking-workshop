/**
 * One control geometry for the drawer's fields, shared because two of them are
 * assembled from different elements — a native `select`, a `textarea` and the
 * React Aria button `OwnerSelect` renders — and sit directly above one another.
 * Keeping the border, height and focus ring in one place is what makes them
 * read as the same control.
 */
export const CONTROL_CLASSNAME =
  'border-primary bg-primary text-primary shadow-xs outline-focus-ring w-full rounded-lg border text-sm transition-colors duration-150 hover:border-fg-quaternary focus-visible:border-fuut-purple focus-visible:outline-2 focus-visible:outline-offset-2';
