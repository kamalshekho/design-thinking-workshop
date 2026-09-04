/**
 * The two fixed routes the form offers, alongside the backend-owned
 * Vereinsarbeit categories (see ./api.ts).
 *
 * A route is the applicant's own answer to what they want (see Route in
 * ../../../CONTEXT.md). These two end the form in a panel with an external
 * link and never reach the applications endpoint; every other selection is a
 * category, loaded from the backend.
 */
export const FIXED_ROUTES = ['COMMUNITY', 'SUPPORTING_MEMBER'] as const;

export type FixedRoute = (typeof FIXED_ROUTES)[number];

export function isFixedRoute(value: string): value is FixedRoute {
  return (FIXED_ROUTES as readonly string[]).includes(value);
}

export const WEEKLY_TIME_OPTIONS = [
  'HOURS_1_2',
  'HOURS_3_5',
  'HOURS_5_PLUS',
  'IRREGULAR',
] as const;

export type WeeklyTime = (typeof WEEKLY_TIME_OPTIONS)[number];

/** What the form shows once the first field holds a route or a category. */
export type RouteOutcome = 'application' | 'community' | 'supporting-member';

export function outcomeOf(value: string): RouteOutcome {
  if (value === 'COMMUNITY') return 'community';
  if (value === 'SUPPORTING_MEMBER') return 'supporting-member';
  return 'application';
}

/**
 * The version of the consent wording the applicant agrees to. Bump this
 * whenever the consent sentence in DESIGN.md section 23 changes, so that
 * applications stay attributable to the text they were submitted under.
 */
export const CONSENT_TEXT_VERSION = '2026-09';
