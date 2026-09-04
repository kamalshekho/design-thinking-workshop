import { getJson, postJson } from '../../lib/http';
import { isUuid } from '../../lib/uuid';
import type { SubmitErrorCode } from './errors';
import type { FixedRoute, WeeklyTime } from './routes';
import { CONSENT_TEXT_VERSION } from './routes';
import type { ApplicationValues } from './schema';

/**
 * The transport layer for the form. The whole contract with the backend lives
 * here and in API.md — no other module builds a request or reads a response.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';
const APPLICATIONS_URL = `${BASE_URL}/api/v1/applications`;
const ROUTE_SELECTIONS_URL = `${BASE_URL}/api/v1/route-selections`;
const CATEGORIES_URL = `${BASE_URL}/api/v1/categories`;

/** Category labels are 1–120 characters after trimming (`A6`, see API.md). */
const LABEL_MAX = 120;

/**
 * A field of work the backend currently accepts applications for. The
 * backend owns this data (`A12`, see ../../../CONTEXT.md, "Category") — the
 * frontend only displays it.
 */
export interface Category {
  id: string;
  label: string;
}

export interface ApplicationRequest {
  submissionId: string;
  categoryId: string;
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
    categoryId: values.route,
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

function readApplicationId(body: unknown): string | null {
  if (typeof body !== 'object' || body === null) return null;
  const { applicationId } = body as Record<string, unknown>;
  return typeof applicationId === 'string' && applicationId.length > 0
    ? applicationId
    : null;
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
    response = await postJson(
      APPLICATIONS_URL,
      buildApplicationRequest(values, submissionId),
    );
  } catch {
    // Network failure or timeout. Retryable, and the entered values are kept.
    return { status: 'failed', code: 'INTERNAL_ERROR' };
  }

  if (response.status === 201) {
    const applicationId = readApplicationId(await readBody(response));
    if (applicationId !== null) return { status: 'success', applicationId };
    return { status: 'failed', code: 'INTERNAL_ERROR' };
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

export type FetchCategoriesResult =
  { status: 'success'; categories: Category[] } | { status: 'failed' };

/**
 * `null` means the body does not match the contract at all — a missing or
 * non-array `categories`, or an entry without a string `id`/`label` — and
 * must surface as a load failure, never as a silent empty list.
 */
function readCategories(body: unknown): Category[] | null {
  if (typeof body !== 'object' || body === null) return null;
  const { categories } = body as Record<string, unknown>;
  if (!Array.isArray(categories)) return null;

  const result: Category[] = [];
  const seenIds = new Set<string>();
  for (const entry of categories) {
    if (typeof entry !== 'object' || entry === null) return null;
    const { id, label } = entry as Record<string, unknown>;
    if (typeof id !== 'string' || typeof label !== 'string') return null;
    if (!isUuid(id)) {
      console.warn(`fetchCategories: category id is not a UUID: ${id}`);
      return null;
    }
    const trimmedLabel = label.trim();
    if (trimmedLabel.length === 0 || trimmedLabel.length > LABEL_MAX) {
      console.warn(
        `fetchCategories: category ${id} has an invalid label length: ${String(trimmedLabel.length)}`,
      );
      return null;
    }
    const normalizedId = id.toLowerCase();
    if (seenIds.has(normalizedId)) {
      console.warn(`fetchCategories: duplicate category id: ${id}`);
      return null;
    }
    seenIds.add(normalizedId);
    result.push({ id, label: trimmedLabel });
  }
  return result;
}

/**
 * Fetches the categories currently open for applications, already in display
 * order (see API.md), once per call — cancel `signal` to drop a stale
 * request instead of letting it resolve into state. A non-2xx response, a
 * malformed body, or a network failure all surface as `failed` — the caller
 * must offer a retry, never a built-in fallback list.
 */
export async function fetchCategories(
  signal?: AbortSignal,
): Promise<FetchCategoriesResult> {
  let response: Response;

  try {
    response = await getJson(CATEGORIES_URL, { signal });
  } catch {
    return { status: 'failed' };
  }

  if (!response.ok) return { status: 'failed' };

  const body: unknown = await response.json().catch(() => null);
  const categories = readCategories(body);
  if (categories === null) return { status: 'failed' };
  return { status: 'success', categories };
}

export type RouteSelection =
  | { type: 'fixed'; route: FixedRoute }
  | { type: 'category'; categoryId: string };

/**
 * Reports which fixed route or category the applicant picked, so that A5 —
 * the assumption that roughly four in five requests want the community
 * rather than association work — becomes an observed number instead of an
 * invention (see API.md).
 *
 * Fire-and-forget by design: a broken counter must never affect an applicant,
 * so every failure is swallowed.
 */
export function reportRouteSelection(selection: RouteSelection): void {
  const body =
    selection.type === 'fixed'
      ? { route: selection.route }
      : { route: 'CATEGORY', categoryId: selection.categoryId };
  void postJson(ROUTE_SELECTIONS_URL, body, { keepalive: true }).catch(
    () => undefined,
  );
}
