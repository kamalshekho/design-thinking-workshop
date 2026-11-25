/**
 * Clone path: `components/base/badges/badge-types.ts`. `FlagTypes`,
 * `IconComponentType` and `BadgeTypeColors` are cut, as nothing reads them.
 */

export type Sizes = 'sm' | 'md' | 'lg';

export type BadgeColors =
  | 'gray'
  | 'brand'
  | 'error'
  | 'warning'
  | 'success'
  | 'slate'
  | 'sky'
  | 'blue'
  | 'indigo'
  | 'purple'
  | 'pink'
  | 'orange';

type ExtractColorKeys<T> = T extends { styles: infer C } ? keyof C : never;
type ExtractBadgeKeys<T> = keyof T;

export type BadgeTypeToColorMap<T> = {
  [K in ExtractBadgeKeys<T>]: ExtractColorKeys<T[K]>;
};

export const badgeTypes = {
  pillColor: 'pill-color',
  badgeColor: 'color',
  badgeModern: 'modern',
} as const;

export type BadgeTypes = (typeof badgeTypes)[keyof typeof badgeTypes];
