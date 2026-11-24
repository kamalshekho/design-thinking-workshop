/**
 * Everything the dashboard does to an Application: the list, the state history
 * behind Übersicht's sparklines, the one `PATCH` a Staff member's edits travel
 * as, and the permanent erase.
 *
 * Both reads are whole-list reads: there is no server-side search, filter,
 * sort or pagination, and the dashboard computes every view from the array it
 * holds (`API.md`, "Applications" and "State changes").
 *
 * `toApplication` is exported because the live stream needs it. `API.md`
 * promises an event's `data` is *exactly* what the list returns, and the
 * backend keeps that promise with one mapping of its own — so decoding an
 * event through a second mapping here is how the two would drift.
 */

import * as z from 'zod/v4-mini';

import type { Application, ApplicationPatch } from '@/domain/application';
import { APPLICATION_STATUSES, WEEKLY_TIMES } from '@/domain/application';
import type { StateChange } from '@/domain/stateChange';
import {
  STATE_CHANGE_FIELDS,
  STATE_CHANGE_WINDOW_DAYS,
} from '@/domain/stateChange';

import { request, requestNoContent } from './transport';

/**
 * The wire shape, validated at the transport boundary. Field for field the
 * domain type, because issue #27 moved the dashboard's own names onto the
 * wire's rather than the other way round — Zod's default object stripping
 * keeps a field the backend adds later from reaching a screen unnoticed.
 *
 * Exported because `queries/applicationEvents.ts` validates live-stream
 * events against the exact same schema (`API.md`).
 */
export const applicationWireSchema = z.object({
  id: z.string(),
  categoryId: z.string(),
  name: z.string(),
  email: z.string(),
  weeklyTime: z.enum(WEEKLY_TIMES),
  about: z.nullable(z.string()),
  status: z.enum(APPLICATION_STATUSES),
  ownerId: z.nullable(z.string()),
  internalNotes: z.string(),
  discardedAt: z.nullable(z.string()),
  consentAt: z.string(),
  consentTextVersion: z.string(),
  submittedAt: z.string(),
});

const applicationsResponseSchema = z.object({
  applications: z.array(applicationWireSchema),
});

export async function fetchApplications(): Promise<Application[]> {
  const { applications } = await request(
    'GET',
    '/applications',
    applicationsResponseSchema,
  );

  return applications;
}

const stateChangeWireSchema = z.object({
  applicationId: z.string(),
  at: z.string(),
  field: z.enum(STATE_CHANGE_FIELDS),
  to: z.union([z.string(), z.boolean(), z.null()]),
});

const stateChangesResponseSchema = z.object({
  changes: z.array(stateChangeWireSchema),
});

export async function fetchStateChanges(
  days: number = STATE_CHANGE_WINDOW_DAYS,
): Promise<StateChange[]> {
  const { changes } = await request(
    'GET',
    `/applications/changes?days=${String(days)}`,
    stateChangesResponseSchema,
  );

  return changes;
}

/**
 * The one write a Staff member makes on an Application (`API.md`,
 * `PATCH /api/v1/staff/applications/{id}`). Any subset of the four fields; the
 * response is the complete Application, so the caller never has to infer what
 * happened.
 *
 * The body is passed through as it was built rather than normalised here: an
 * absent `ownerId` and an explicit `null` mean different things on the wire,
 * and a mapping that filled either in would decide for the drawer.
 */
export async function patchApplication(
  id: string,
  patch: ApplicationPatch,
): Promise<Application> {
  return request(
    'PATCH',
    `/applications/${encodeURIComponent(id)}`,
    applicationWireSchema,
    patch,
  );
}

/**
 * Erases the row, and its State changes with it (`API.md`). `204`, so there is
 * nothing to map; `400 NOT_DISCARDED` when the Application has not been
 * discarded first, which the fourth screen makes unreachable and the backend
 * refuses anyway.
 */
export async function eraseApplication(id: string): Promise<void> {
  await requestNoContent(
    'DELETE',
    `/applications/${encodeURIComponent(id)}/permanently`,
  );
}
