import type { AriaAttributes } from 'react';

/** RHF's `aria-invalid` register prop can arrive as a boolean or the string form. */
export function isAriaInvalid(
  ariaInvalid: AriaAttributes['aria-invalid'],
): boolean {
  return ariaInvalid === true || ariaInvalid === 'true';
}
