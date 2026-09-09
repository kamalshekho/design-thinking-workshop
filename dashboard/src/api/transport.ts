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

import type { ApiFieldProblem } from './problem';
import { ApiProblem } from './problem';

/** Every path in this contract sits under it (`API.md`, "Scope"). */
export const STAFF_API = '/api/v1/staff';

/**
 * The `problem+json` body, as far as the dashboard reads it. `title`, `type`
 * and `detail` are deliberately ignored — they are English, and the dashboard
 * words the `code` itself (ADR-0003).
 */
type ProblemBody = {
  code?: unknown;
  errors?: unknown;
};

function fieldProblemsIn(body: ProblemBody): ApiFieldProblem[] {
  if (!Array.isArray(body.errors)) {
    return [];
  }

  return body.errors.flatMap((entry: unknown) => {
    if (typeof entry !== 'object' || entry === null) {
      return [];
    }

    const { field, code } = entry as { field?: unknown; code?: unknown };
    return typeof field === 'string' && typeof code === 'string'
      ? [{ field, code }]
      : [];
  });
}

/**
 * A response body that is not the JSON it claimed to be leaves the problem
 * with its status and no code, which the lookup words generally. The
 * alternative — letting the parse failure escape — would report a syntax
 * error where a Staff member needs to know the request failed.
 */
async function problemFrom(response: Response): Promise<ApiProblem> {
  let body: ProblemBody = {};

  try {
    body = (await response.json()) as ProblemBody;
  } catch {
    body = {};
  }

  const retryAfter = Number(response.headers.get('Retry-After'));

  return new ApiProblem({
    status: response.status,
    code: typeof body.code === 'string' ? body.code : undefined,
    errors: fieldProblemsIn(body),
    retryAfterSeconds: Number.isFinite(retryAfter) ? retryAfter : undefined,
  });
}

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

/**
 * Sends one request and returns its decoded body. `T` is what the endpoint
 * answers; an endpoint that answers `204 No Content` is `requestNoContent`
 * below rather than this.
 */
export async function request<T>(
  method: Method,
  path: string,
  body?: unknown,
): Promise<T> {
  const response = await fetch(`${STAFF_API}${path}`, {
    method,
    credentials: 'same-origin',
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

  if (!response.ok) {
    throw await problemFrom(response);
  }

  if (response.status === 204) {
    return null as T;
  }

  return (await response.json()) as T;
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
  await request<null>(method, path, body);
}
