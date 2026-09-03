import type { SubmitErrorCode } from './errors';
import type { ApplicationCategory, Route, WeeklyTime } from './routes';
import { CONSENT_TEXT_VERSION } from './routes';
import type { ApplicationValues } from './schema';

/**
 * The transport layer for the form. The whole contract with the backend lives
 * here and in API.md — no other module builds a request or reads a response.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';
const APPLICATIONS_URL = `${BASE_URL}/api/v1/applications`;
const ROUTE_SELECTIONS_URL = `${BASE_URL}/api/v1/route-selections`;
const TIMEOUT_MS = 15_000;

export interface ApplicationRequest {
  submissionId: string;
  category: ApplicationCategory;
  name: string;
  email: string;
  weeklyTime: WeeklyTime;
  about?: string;
  privacyConsent: true;
  consentTextVersion: string;
  website: string;
}

export interface ServerFieldError {
  field: string;
  code: string;
}

export type SubmitResult =
  | { status: 'success'; applicationId: string }
  | { status: 'field-errors'; errors: ServerFieldError[] }
  | { status: 'failed'; code: SubmitErrorCode };

export function buildApplicationRequest(
  values: ApplicationValues,
  submissionId: string,
): ApplicationRequest {
  return {
    submissionId,
    category: values.route,
    name: values.name,
    email: values.email,
    weeklyTime: values.weeklyTime,
    // Omitted rather than sent empty, so the backend stores null and not ""
    ...(values.about.length > 0 ? { about: values.about } : {}),
    privacyConsent: true,
    consentTextVersion: CONSENT_TEXT_VERSION,
    website: values.website,
  };
}

interface ProblemDetail {
  code?: unknown;
  errors?: unknown;
}

function readFieldErrors(body: unknown): ServerFieldError[] {
  if (typeof body !== 'object' || body === null) return [];
  const { errors } = body as ProblemDetail;
  if (!Array.isArray(errors)) return [];

  return errors.flatMap((entry): ServerFieldError[] => {
    if (typeof entry !== 'object' || entry === null) return [];
    const { field, code } = entry as Record<string, unknown>;
    if (typeof field !== 'string' || typeof code !== 'string') return [];
    return [{ field, code }];
  });
}

async function readBody(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * `submissionId` must stay the same across retries of the same submission —
 * that is what lets the backend discard a duplicate caused by a dropped
 * connection instead of creating a second application.
 */
export async function submitApplication(
  values: ApplicationValues,
  submissionId: string,
): Promise<SubmitResult> {
  let response: Response;

  try {
    response = await fetch(APPLICATIONS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildApplicationRequest(values, submissionId)),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    // Network failure or timeout. Retryable, and the entered values are kept.
    return { status: 'failed', code: 'INTERNAL_ERROR' };
  }

  if (response.ok) {
    const body = await readBody(response);
    const applicationId =
      typeof body === 'object' &&
      body !== null &&
      typeof (body as Record<string, unknown>).applicationId === 'string'
        ? ((body as Record<string, unknown>).applicationId as string)
        : '';
    return { status: 'success', applicationId };
  }

  if (response.status === 400) {
    const errors = readFieldErrors(await readBody(response));
    // A 400 the frontend cannot place under a field would leave the applicant
    // staring at an unchanged form, so it falls back to a general message.
    if (errors.length > 0) return { status: 'field-errors', errors };
    return { status: 'failed', code: 'INTERNAL_ERROR' };
  }

  if (response.status === 429) {
    return { status: 'failed', code: 'RATE_LIMITED' };
  }

  return { status: 'failed', code: 'INTERNAL_ERROR' };
}

/**
 * Reports which route the applicant picked, so that A5 — the assumption that
 * roughly four in five requests want the community rather than association
 * work — becomes an observed number instead of an invention (see API.md).
 *
 * Fire-and-forget by design: a broken counter must never affect an applicant,
 * so every failure is swallowed.
 */
export function reportRouteSelection(route: Route): void {
  void fetch(ROUTE_SELECTIONS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ route }),
    keepalive: true,
  }).catch(() => undefined);
}
