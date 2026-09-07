/**
 * The Application domain types, as `CONTEXT.md` defines them. Identifiers and
 * enum values are English (ADR-0003); every German string the staff member
 * reads lives in `src/content/de.ts`.
 */

/** The status flow proposed in `A9`. `categorised` is deliberately not a status. */
export const APPLICATION_STATUSES = [
  'new',
  'in-review',
  'intro-booked',
  'active',
  'waitlisted',
  'declined',
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

/**
 * The statuses that mean an Application is done, one way or the other.
 * Übersicht's "Offene Anfragen" panel (`A13`) excludes these; every other
 * status counts as open, so this list — not a single status — is what "open"
 * means.
 */
export const COMPLETED_APPLICATION_STATUSES: readonly ApplicationStatus[] = [
  'active',
  'declined',
];

/**
 * A Category always names Vereinsarbeit. The backend owns the list (`A12`);
 * the mock stands in for it until the contract in issue #16 exists. The type
 * and the rules over it live in `domain/category.ts` — re-exported here
 * because every Application-facing component already reads it from this file.
 */
export type { Category } from './category';

/** The Staff member who owns an Application. An Application may have none. */
export type Owner = {
  id: string;
  name: string;
  /**
   * Photo of the Staff member, if there is one. Optional on purpose: a Staff
   * member without a photo falls back to initials, so the Zuständigkeit column
   * keeps the same shape either way.
   */
  avatar?: string;
};

export type Application = {
  id: string;
  applicantName: string;
  email: string;
  receivedAt: string;
  categoryId: string;
  /** Hours per week the Applicant offered on the form. */
  weeklyAvailability: number;
  status: ApplicationStatus;
  ownerId: string | null;
  message: string;
  internalNotes: string;
  /**
   * When a Staff member discarded it, or `null` while it is in the working
   * list (`A16`). Server-stamped on the wire (`API.md`); the mock stamps it
   * here. Discarded is not a Status — an Application carries both at once.
   */
  discardedAt: string | null;
  consent: {
    givenAt: string;
    privacyPolicyVersion: string;
  };
};

/**
 * An Application nobody has taken on yet. The Applications list reads this as
 * its unread state (`A14`): as long as no Staff member owns the Application,
 * the row stays emphasised; assigning an Owner — or clearing one — flips it.
 */
export function isUnassigned(
  application: Pick<Application, 'ownerId'>,
): boolean {
  return application.ownerId === null;
}

/**
 * An Application a Staff member has taken out of the working list without
 * erasing it (`A16`). It keeps its Category, Status, Owner and notes, and only
 * the fourth screen shows it: Anfragen, Übersicht's panel, the metric cards
 * and the view counts all read the working list, which is every Application
 * this predicate says no to.
 */
export function isDiscarded(
  application: Pick<Application, 'discardedAt'>,
): boolean {
  return application.discardedAt !== null;
}

/**
 * Discards the named Applications, or restores them when `discardedAt` is
 * `null`. One function for both directions, because they are one field and
 * the wire has one endpoint for them too (`PATCH … { discarded }`).
 */
export function setDiscarded(
  applications: readonly Application[],
  ids: ReadonlySet<string>,
  discardedAt: string | null,
): Application[] {
  return applications.map((application) =>
    ids.has(application.id) ? { ...application, discardedAt } : application,
  );
}

/** The named views over the Applications list that issue #10 asks for. */
export const APPLICATION_VIEWS = ['all', 'unassigned', 'stale'] as const;

export type ApplicationView = (typeof APPLICATION_VIEWS)[number];

/**
 * The age at which an Application counts as stale. This number has no
 * assumption entry yet — issue #17 must add one before the view ships.
 */
export const STALE_AFTER_DAYS = 7;
