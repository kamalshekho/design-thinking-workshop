/**
 * Clone path: `utils/is-react-component.ts`. Reduced to `isReactComponent`,
 * the one export a call site reads: `isFunctionComponent`,
 * `isClassComponent` and `isForwardRefComponent` are folded into it, and
 * every `any` is gone with the file-wide eslint-disable that allowed it.
 */

import type { ComponentType, ReactNode } from 'react';

/** A class component is a function too, so the function test covers it. */
export const isReactComponent = <P>(
  component: ComponentType<P> | ReactNode,
): component is ComponentType<P> =>
  typeof component === 'function' ||
  (typeof component === 'object' &&
    component !== null &&
    '$$typeof' in component &&
    String(component.$$typeof) === 'Symbol(react.forward_ref)');
