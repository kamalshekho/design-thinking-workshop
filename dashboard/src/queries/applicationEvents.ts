/**
 * What a live-stream event does to the Applications list — as a pure
 * function, so the rules are tested without an `EventSource`, jsdom or a
 * timer (ADR-0006). `useApplicationStream` owns the connection and calls
 * this; nothing else knows the event names.
 */

import type { ApplicationWire } from '@/api/applications';
import { toApplication } from '@/api/applications';
import type { Application } from '@/domain/application';

/** The three the contract names (`API.md`, "The live stream"). */
export const APPLICATION_EVENT_TYPES = [
  'application.created',
  'application.updated',
  'application.deleted',
] as const;

export type ApplicationEventType = (typeof APPLICATION_EVENT_TYPES)[number];

export type ApplicationEvent = {
  type: ApplicationEventType;
  /**
   * The complete Application, in exactly the shape the list returns —
   * including on `application.deleted`, because the dashboard may need to
   * drop it from the fourth screen too.
   */
  application: Application;
};

/**
 * Decodes one event's `data`. Returns `null` for a body that is not the JSON
 * it claimed to be: the stream keeps no replay buffer, so a dropped event
 * costs nothing a refetch does not repair, while throwing here would take the
 * connection down with it.
 */
export function parseApplicationEvent(
  type: ApplicationEventType,
  data: string,
): ApplicationEvent | null {
  try {
    return {
      type,
      application: toApplication(JSON.parse(data) as ApplicationWire),
    };
  } catch {
    return null;
  }
}

function withoutApplication(
  applications: readonly Application[],
  id: string,
): Application[] {
  return applications.filter((application) => application.id !== id);
}

/**
 * The three rules, applied to the list the cache holds.
 *
 * `created` and `updated` share one branch on purpose. Both carry the whole
 * row, and either can arrive for an Application the list already has or has
 * not: the refetch on every `open` may already have picked up a creation, and
 * an update can be the first thing seen of an Application submitted while the
 * stream was down. Writing them as "add" and "replace" would leave both cases
 * to a guard at every call site; one idempotent upsert has neither case.
 *
 * A row the list has not seen goes to the front. Newest-first is what the
 * list arrives in, and `API.md` calls that order a convenience rather than a
 * contract — every screen sorts for itself.
 */
export function applyApplicationEvent(
  applications: readonly Application[],
  event: ApplicationEvent,
): Application[] {
  const { application } = event;

  if (event.type === 'application.deleted') {
    return withoutApplication(applications, application.id);
  }

  const known = applications.some(
    (candidate) => candidate.id === application.id,
  );

  return known
    ? applications.map((candidate) =>
        candidate.id === application.id ? application : candidate,
      )
    : [application, ...applications];
}
