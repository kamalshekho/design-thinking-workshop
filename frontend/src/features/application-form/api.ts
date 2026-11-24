import { z } from 'zod';

import type { SubmitErrorCode } from '../../lib/errorCodes';
import { getJson, postJson } from '../../lib/http';
import type { FixedRoute, WeeklyTime } from '../../lib/routes';
import { CONSENT_TEXT_VERSION } from '../../lib/routes';
import { isUuid } from '../../lib/uuid';
import type { ApplicationValues } from './schema';

z.config({ jitless: true });

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

interface ApplicationRequest {
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

interface ServerFieldError {
  field: string;
  code: string;
}

export type SubmitResult =
  | { status: 'success'; applicationId: string }
  | { status: 'field-errors'; errors: ServerFieldError[] }
  | { status: 'failed'; code: SubmitErrorCode };

function buildApplicationRequest(
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

const fieldErrorSchema = z.object({
  field: z.string(),
  code: z.string(),
});

const problemDetailSchema = z.object({
  errors: z.array(z.unknown()),
});

const applicationCreatedSchema = z.object({
  applicationId: z.string().min(1),
});

const categoriesResponseSchema = z.object({
  categories: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
    }),
  ),
});

function readFieldErrors(body: unknown): ServerFieldError[] {
  const parsed = problemDetailSchema.safeParse(body);
  if (!parsed.success) return [];

  return parsed.data.errors.flatMap((entry): ServerFieldError[] => {
    const fieldError = fieldErrorSchema.safeParse(entry);
    return fieldError.success ? [fieldError.data] : [];
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
  const parsed = applicationCreatedSchema.safeParse(body);
  return parsed.success ? parsed.data.applicationId : null;
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
  const parsed = categoriesResponseSchema.safeParse(body);
  if (!parsed.success) return null;

  const result: Category[] = [];
  const seenIds = new Set<string>();
  for (const { id, label } of parsed.data.categories) {
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
