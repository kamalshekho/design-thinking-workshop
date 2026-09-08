/**
 * The Applications list and the state history behind Übersicht's sparklines
 * (`API.md`, "Applications" and "State changes"). Both are whole-list reads:
 * there is no server-side search, filter, sort or pagination, and the
 * dashboard computes every view from the array it holds.
 *
 * `toApplication` is exported because the live stream needs it. `API.md`
 * promises an event's `data` is *exactly* what the list returns, and the
 * backend keeps that promise with one mapping of its own — so decoding an
 * event through a second mapping here is how the two would drift.
 */

import type { Application } from '@/domain/application';
import type { StateChange } from '@/domain/stateChange';
import { STATE_CHANGE_WINDOW_DAYS } from '@/domain/stateChange';

import { request } from './transport';

/**
 * The wire shape. Field for field the domain type, because issue #27 moved
 * the dashboard's own names onto the wire's rather than the other way round —
 * the mapping below is therefore a projection, not a translation, and its job
 * is to keep a field the backend adds later from reaching a screen unnoticed.
 *
 * The two enums arrive as the strings `API.md` lists and are taken at their
 * word: a value outside them is a contract breach, and rejecting the whole
 * list over one unknown status would replace a wrong badge with no dashboard.
 */
export type ApplicationWire = {
  id: string;
  categoryId: string;
  name: string;
  email: string;
  weeklyTime: Application['weeklyTime'];
  about: string | null;
  status: Application['status'];
  ownerId: string | null;
  internalNotes: string;
  discardedAt: string | null;
  consentAt: string;
  consentTextVersion: string;
  submittedAt: string;
};

export function toApplication(wire: ApplicationWire): Application {
  return {
    id: wire.id,
    categoryId: wire.categoryId,
    name: wire.name,
    email: wire.email,
    weeklyTime: wire.weeklyTime,
    about: wire.about,
    status: wire.status,
    ownerId: wire.ownerId,
    internalNotes: wire.internalNotes,
    discardedAt: wire.discardedAt,
    consentAt: wire.consentAt,
    consentTextVersion: wire.consentTextVersion,
    submittedAt: wire.submittedAt,
  };
}

export async function fetchApplications(): Promise<Application[]> {
  const { applications } = await request<{
    applications: ApplicationWire[];
  }>('GET', '/applications');

  return applications.map(toApplication);
}

type StateChangeWire = {
  applicationId: string;
  at: string;
  field: StateChange['field'];
  to: string | boolean | null;
};

export async function fetchStateChanges(
  days: number = STATE_CHANGE_WINDOW_DAYS,
): Promise<StateChange[]> {
  const { changes } = await request<{ changes: StateChangeWire[] }>(
    'GET',
    `/applications/changes?days=${String(days)}`,
  );

  return changes.map((change) => ({
    applicationId: change.applicationId,
    at: change.at,
    field: change.field,
    to: change.to,
  }));
}
