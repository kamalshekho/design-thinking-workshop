/**
 * One recorded change to one of the three fields Übersicht's metric cards
 * read (`API.md`, "State changes").
 *
 * It exists because a card's value last Tuesday depends on what `status` and
 * `ownerId` were last Tuesday, and an Application carries only its current
 * pair — so replaying today's values across the week produces a curve that is
 * confidently wrong. The backend records every change and the dashboard walks
 * backwards from the current state in
 * `features/overview/applicationsAsOf.ts`; this type and the request behind
 * it are what that walk walks over.
 */

/** The three fields a card reads, and the only ones recorded (`API.md`). */
export const STATE_CHANGE_FIELDS = ['STATUS', 'OWNER', 'DISCARDED'] as const;

export type StateChangeField = (typeof STATE_CHANGE_FIELDS)[number];

export type StateChange = {
  /** The Application it happened to; an id in the list. */
  applicationId: string;
  /** When it was applied, on the server's clock. */
  at: string;
  field: StateChangeField;
  /**
   * The new value, typed by `field`: one of the six statuses for `STATUS`, a
   * Staff member's id or `null` for `OWNER`, and `true`/`false` for
   * `DISCARDED` — `true` meaning discarded, matching `PATCH`'s own boolean
   * rather than a timestamp.
   */
  to: string | boolean | null;
};

/**
 * How far back the dashboard asks for. The sparklines need seven days and
 * slice for themselves, so the window is a constant here rather than a
 * release of the backend (`API.md`); 30 is the endpoint's own default and
 * leaves room for a longer trend without a second contract.
 */
export const STATE_CHANGE_WINDOW_DAYS = 30;
