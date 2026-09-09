/**
 * The Applications list as it stood on a past day, reconstructed from the
 * state history (`API.md`, "State changes").
 *
 * Übersicht's three cards each draw a seven-day sparkline. The counts come
 * from the list, but the seven days cannot: an Application carries only its
 * current Status, Owner and Discarded flag, so replaying today's values
 * across the week draws a curve that is confidently wrong. `GET
 * /applications/changes` records what changed and when, and this walks
 * backwards over it.
 *
 * **Backwards from the current state, not forwards from submission.** For one
 * field, the value on `asOf` is: the current value when nothing changed after
 * `asOf`, otherwise the `to` of the last change at or before `asOf`, and only
 * where there is no such change the value the Application was submitted with
 * — `NEW`, no Owner, not discarded, which `API.md` calls a correct
 * reconstruction rather than a fallback.
 *
 * Starting from the current value is what keeps a truncated window honest.
 * The history is fetched for `STATE_CHANGE_WINDOW_DAYS` (30), so a change
 * older than that is not in it; a forwards replay would then read a field
 * with no rows as never-changed and answer `NEW` for an Application that has
 * been `ACTIVE` for two months. Walking backwards, no rows after `asOf` means
 * the field is unchanged since then, whatever it changed from before the
 * window opened.
 */

import type { Application } from '@/domain/application';
import { APPLICATION_STATUSES } from '@/domain/application';
import type { StateChange, StateChangeField } from '@/domain/stateChange';

type ChangesByField = ReadonlyMap<StateChangeField, readonly StateChange[]>;

/**
 * The rows for one Application, split by field and oldest first. Grouping is
 * per call rather than cached: the window holds a few dozen rows and a cache
 * keyed on two arrays would cost more than the walk it saves.
 */
function groupByApplication(
  stateChanges: readonly StateChange[],
): ReadonlyMap<string, ChangesByField> {
  const byApplication = new Map<string, Map<StateChangeField, StateChange[]>>();

  const ordered = [...stateChanges].sort((a, b) => (a.at < b.at ? -1 : 1));

  for (const change of ordered) {
    const byField =
      byApplication.get(change.applicationId) ??
      new Map<StateChangeField, StateChange[]>();
    byField.set(change.field, [...(byField.get(change.field) ?? []), change]);
    byApplication.set(change.applicationId, byField);
  }

  return byApplication;
}

/**
 * The last change at or before `asOf`, and whether any change came after it.
 * A `false` for `changedAfter` is what tells the caller the field is unchanged
 * since `asOf` and the Application's current value still stands.
 */
function valueAt(
  changes: readonly StateChange[] | undefined,
  asOf: Date,
): { changedAfter: boolean; last: StateChange | undefined } {
  if (changes === undefined || changes.length === 0) {
    return { changedAfter: false, last: undefined };
  }

  const cutoff = asOf.getTime();
  const upTo = changes.filter(
    (change) => new Date(change.at).getTime() <= cutoff,
  );

  return {
    changedAfter: upTo.length < changes.length,
    last: upTo.at(-1),
  };
}

function isStatus(value: unknown): value is Application['status'] {
  return (
    typeof value === 'string' &&
    (APPLICATION_STATUSES as readonly string[]).includes(value)
  );
}

/** One Application as it stood on `asOf`. */
function applicationAsOf(
  application: Application,
  changes: ChangesByField | undefined,
  asOf: Date,
): Application {
  const status = valueAt(changes?.get('STATUS'), asOf);
  const owner = valueAt(changes?.get('OWNER'), asOf);
  const discarded = valueAt(changes?.get('DISCARDED'), asOf);

  /** No `STATUS` row after `asOf` means it still holds today's; `NEW` is what it was submitted with. */
  const statusThen = !status.changedAfter
    ? application.status
    : isStatus(status.last?.to)
      ? status.last.to
      : 'NEW';

  /** `to: null` is a cleared Owner, and no row at all means it never had one. */
  const ownerIdThen = !owner.changedAfter
    ? application.ownerId
    : typeof owner.last?.to === 'string'
      ? owner.last.to
      : null;

  /**
   * The wire records `DISCARDED` as a boolean while the Application carries a
   * timestamp, so a `true` is dated by the row that set it — the moment it
   * was discarded, which is the only date that row can mean.
   */
  const discardedAtThen = !discarded.changedAfter
    ? application.discardedAt
    : discarded.last !== undefined && discarded.last.to === true
      ? discarded.last.at
      : null;

  return {
    ...application,
    status: statusThen,
    ownerId: ownerIdThen,
    discardedAt: discardedAtThen,
  };
}

/**
 * Every Application that had been submitted by `asOf`, each with the Status,
 * Owner and Discarded state it held then. Applications submitted later are
 * left out rather than reconstructed: a card's count is of what had arrived,
 * and `filterApplications` reads `submittedAt` for the "Lange offen" view, so
 * the caller passes `asOf` as its reference date too.
 */
export function applicationsAsOf(
  applications: readonly Application[],
  stateChanges: readonly StateChange[],
  asOf: Date,
): Application[] {
  const byApplication = groupByApplication(stateChanges);
  const cutoff = asOf.getTime();

  return applications
    .filter(
      (application) => new Date(application.submittedAt).getTime() <= cutoff,
    )
    .map((application) =>
      applicationAsOf(application, byApplication.get(application.id), asOf),
    );
}
