/**
 * The six routes the form offers, and what each one does.
 *
 * A route is the applicant's own answer to what they want (see Route in
 * ../../../CONTEXT.md). Four routes open an application; two end the form in a
 * panel with an external link and never reach the applications endpoint.
 */

/**
 * Order is mandatory and comes from DESIGN.md section 17. This array is the
 * single source of the option order in the select — do not re-sort it in the
 * component.
 */
export const ROUTES = [
  'COMMUNITY',
  'SOCIAL_MEDIA',
  'EDITORIAL',
  'LEGAL_SUPPORT',
  'SUPPORTING_MEMBER',
  'OTHER',
] as const;

export type Route = (typeof ROUTES)[number];

/**
 * The routes that produce an application. Always a subset of ROUTES, and the
 * only values `category` can take on the wire (see API.md).
 */
export const APPLICATION_CATEGORIES = [
  'SOCIAL_MEDIA',
  'EDITORIAL',
  'LEGAL_SUPPORT',
  'OTHER',
] as const;

export type ApplicationCategory = (typeof APPLICATION_CATEGORIES)[number];

export const WEEKLY_TIME_OPTIONS = [
  'HOURS_1_2',
  'HOURS_3_5',
  'HOURS_5_PLUS',
  'IRREGULAR',
] as const;

export type WeeklyTime = (typeof WEEKLY_TIME_OPTIONS)[number];

/** What the form shows once a route is selected. */
export type RouteOutcome = 'application' | 'community' | 'supporting-member';

export function outcomeOf(route: Route): RouteOutcome {
  switch (route) {
    case 'COMMUNITY':
      return 'community';
    case 'SUPPORTING_MEMBER':
      return 'supporting-member';
    default:
      return 'application';
  }
}

export function isApplicationCategory(
  route: Route | '',
): route is ApplicationCategory {
  return (APPLICATION_CATEGORIES as readonly string[]).includes(route);
}

/**
 * The version of the consent wording the applicant agrees to. Bump this
 * whenever the consent sentence in DESIGN.md section 23 changes, so that
 * applications stay attributable to the text they were submitted under.
 */
export const CONSENT_TEXT_VERSION = '2026-09';
