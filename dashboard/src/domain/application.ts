/**
 * The Application domain types, as `CONTEXT.md` defines them. Identifiers and
 * enum values are English (ADR-0003); every German string the staff member
 * reads lives in `src/content/de.ts`.
 */

/** The status flow proposed in `A9`. `categorised` is deliberately not a status. */
export const APPLICATION_STATUSES = [
  'NEW',
  'IN_REVIEW',
  'INTRO_BOOKED',
  'ACTIVE',
  'WAITLISTED',
  'DECLINED',
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

/**
 * How much time an Applicant offers per week. A band, not a number of hours:
 * the form asks for one of these four and `IRREGULAR` is not a quantity at
 * all (`API.md`, "Wire names").
 */
export const WEEKLY_TIMES = [
  'HOURS_1_2',
  'HOURS_3_5',
  'HOURS_5_PLUS',
  'IRREGULAR',
] as const;

export type WeeklyTime = (typeof WEEKLY_TIMES)[number];

/**
 * The statuses that mean an Application is done, one way or the other.
 * Übersicht's "Offene Anfragen" panel (`A13`) excludes these; every other
 * status counts as open, so this list — not a single status — is what "open"
 * means.
 */
export const COMPLETED_APPLICATION_STATUSES: readonly ApplicationStatus[] = [
  'ACTIVE',
  'DECLINED',
];

/**
 * A Category always names Vereinsarbeit. The backend owns the list (`A12`);
 * the mock stands in for it until the contract in issue #16 exists. The type
 * and the rules over it live in `domain/category.ts` — re-exported here
 * because every Application-facing component already reads it from this file.
 */
export type { Category } from './category';

/**
 * The Staff member who owns an Application. An Application may have none.
 *
 * A name and an id, which is all `GET /api/v1/staff/members` sends: no
 * address, because the selector and the filter show names and an address per
 * row would spread personal data further than either screen needs, and no
 * photo, because there is none to send (`domain/staffMember.ts`).
 */
export type Owner = {
  id: string;
  name: string;
};

export type Application = {
  id: string;
  name: string;
  email: string;
  submittedAt: string;
  categoryId: string;
  /** The time band the Applicant picked on the form. */
  weeklyTime: WeeklyTime;
  status: ApplicationStatus;
  ownerId: string | null;
  /**
   * What the Applicant wrote about themselves. `null` when they wrote
   * nothing — the backend stores an empty text as no text (`API.md`), so a
   * row must not assume a string here.
   */
  about: string | null;
  internalNotes: string;
  /**
   * When a Staff member discarded it, or `null` while it is in the working
   * list (`A16`). Server-stamped on the wire (`API.md`); the mock stamps it
   * here. Discarded is not a Status — an Application carries both at once.
   */
  discardedAt: string | null;
  /** When the Applicant agreed to the consent text, server-stamped. */
  consentAt: string;
  /** Which wording of the consent text they agreed to, e.g. `2026-09`. */
  consentTextVersion: string;
};

/**
 * What a Staff member may change about an Application; the rest is
 * server-owned. It is the body of `PATCH /applications/{id}` (`API.md`), which
 * is why the screens hand one of these up rather than a replacement list — a
 * per-field change is not recoverable from a new array.
 */
export type ApplicationEdit = Partial<
  Pick<Application, 'status' | 'ownerId' | 'internalNotes'>
>;

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

/**
 * How much a Staff member may write into `internalNotes` before the backend
 * answers `NOTES_TOO_LONG` (`API.md`). The German wording of that code counts
 * from this number, and the textarea will cap at it.
 */
export const INTERNAL_NOTES_MAX_LENGTH = 4000;

/** The named views over the Applications list that issue #10 asks for. */
export const APPLICATION_VIEWS = ['all', 'unassigned', 'stale'] as const;

export type ApplicationView = (typeof APPLICATION_VIEWS)[number];

/**
 * The age at which an Application counts as stale (`A19`). The German label
 * on the "stale" view is built from this number, so the two cannot disagree.
 */
export const STALE_AFTER_DAYS = 7;
