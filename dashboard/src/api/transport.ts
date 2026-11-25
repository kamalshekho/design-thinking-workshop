/**
 * The one function that talks to the backend. Everything else in `src/api/`
 * is a path, a body and a mapping over it.
 *
 * Three things are decided here so that no caller repeats them:
 *
 * - **the Sign-in travels as a cookie.** `credentials: 'same-origin'` is what
 *   sends it, and same-origin is the only thing it can be: the cookie is
 *   `SameSite=Strict`, so a second origin would not carry it — which is why
 *   development proxies `/api` rather than pointing at a base URL
 *   (`README.md`, "Getting started");
 * - **a failed response becomes a thrown `ApiProblem`.** Thrown rather than
 *   returned, because TanStack Query's contract is that what a query function
 *   throws becomes `error` (ADR-0006);
 * - **no request is cached.** The list and the state changes are personal data
 *   and the backend sends `Cache-Control: no-store` for them (`API.md`); the
 *   requests say `cache: 'no-store'` from this side too, so a `GET` replayed
 *   from the browser's cache cannot show a Staff member a stale queue.
 *
 * There is no `VITE_API_BASE_URL` and no Mock Service Worker: paths are
 * absolute and same-origin in development and in production alike (issue #29).
 */

import * as z from 'zod/v4-mini';

import type { ApiFieldProblem } from './problem';
import { ApiProblem } from './problem';

// Zod otherwise probes `new Function` to decide whether it may compile
// parsers, and the Content-Security-Policy in nginx forbids eval, so the probe
// shows up as a violation in the console.
z.config({ jitless: true });

/** Every path in this contract sits under it (`API.md`, "Scope"). */
export const STAFF_API = '/api/v1/staff';

/**
 * The `problem+json` body, as far as the dashboard reads it. `title`, `type`
 * and `detail` are deliberately ignored — they are English, and the dashboard
 * words the `code` itself (ADR-0003).
 */
const fieldProblemSchema = z.object({
  field: z.string(),
  code: z.string(),
});

const problemBodySchema = z.object({
  code: z.catch(z.optional(z.string()), undefined),
  errors: z.optional(z.array(z.unknown())),
});

function fieldProblemsIn(
  errors: readonly unknown[] | undefined,
): ApiFieldProblem[] {
  if (errors === undefined) {
    return [];
  }

  return errors.flatMap((entry) => {
    const parsed = fieldProblemSchema.safeParse(entry);

    return parsed.success ? [parsed.data] : [];
  });
}

/**
 * A response body that is not the JSON it claimed to be leaves the problem
 * with its status and no code, which the lookup words generally. The
 * alternative — letting the parse failure escape — would report a syntax
 * error where a Staff member needs to know the request failed.
 */
async function problemFrom(response: Response): Promise<ApiProblem> {
  let raw: unknown;

  try {
    raw = await response.json();
  } catch {
    raw = undefined;
  }

  const parsed = problemBodySchema.safeParse(raw);
  const body = parsed.success ? parsed.data : {};
  const retryAfter = Number(response.headers.get('Retry-After'));

  return new ApiProblem({
    status: response.status,
    code: body.code,
    errors: fieldProblemsIn(body.errors),
    retryAfterSeconds: Number.isFinite(retryAfter) ? retryAfter : undefined,
  });
}

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

async function send(
  method: Method,
  path: string,
  body?: unknown,
): Promise<Response> {
  const response = await fetch(`${STAFF_API}${path}`, {
    method,
    credentials: 'same-origin',
    cache: 'no-store',
    headers:
      body === undefined
        ? { Accept: 'application/json' }
        : { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    throw await problemFrom(response);
  }

  return response;
}

/**
 * Sends one request and validates its decoded body against `schema`. A body
 * that is not JSON or does not match `schema` becomes an `ApiProblem` without
 * a `code`, so a `ZodError` never reaches a caller and the screen falls back
 * to the general error wording. An endpoint that answers `204 No Content` is
 * `requestNoContent` below rather than this.
 */
export async function request<Schema extends z.ZodMiniType>(
  method: Method,
  path: string,
  schema: Schema,
  body?: unknown,
): Promise<z.output<Schema>> {
  const response = await send(method, path, body);

  let raw: unknown;

  try {
    raw = await response.json();
  } catch {
    throw new ApiProblem({ status: response.status });
  }

  const parsed = schema.safeParse(raw);

  if (!parsed.success) {
    throw new ApiProblem({ status: response.status });
  }

  return parsed.data;
}

/**
 * The same request, for an endpoint whose success is a status and nothing
 * more — `DELETE /api/v1/staff/session` is the only one in this contract.
 */
export async function requestNoContent(
  method: Method,
  path: string,
  body?: unknown,
): Promise<void> {
  await send(method, path, body);
}
