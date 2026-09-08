/**
 * The failure the wire throws: one `application/problem+json` body, decoded.
 *
 * It is an `Error` subclass rather than a plain object because TanStack
 * Query's contract is that what a query function throws becomes `error`, and
 * because a thrown non-`Error` loses its stack. The German wording is not on
 * it — `src/content/errorMessage.ts` words a `code`, and a component reads it
 * from there (`README.md`, "Language").
 *
 * Nothing here is exhaustive of what can arrive. `code` is a bare `string`
 * for the reason `domain/apiError.ts` records: a status the contract does not
 * name carries the status's own name as its code, and the lookup answers
 * those with the general wording.
 */

/** One entry of a problem's `errors` array: the field, and why it is wrong. */
export type ApiFieldProblem = {
  field: string;
  code: string;
};

export class ApiProblem extends Error {
  readonly status: number;
  /** The problem's top-level `code`, absent when the body carried none. */
  readonly code: string | undefined;
  readonly errors: readonly ApiFieldProblem[];
  /**
   * Seconds from `Retry-After`, which `RATE_LIMITED` carries (`API.md`,
   * "POST /api/v1/staff/session"). A header rather than a body field, so it
   * is read here and not in the JSON.
   */
  readonly retryAfterSeconds: number | undefined;

  constructor(init: {
    status: number;
    code?: string;
    errors?: readonly ApiFieldProblem[];
    retryAfterSeconds?: number;
  }) {
    super(`${String(init.status)} ${init.code ?? 'unknown'}`);
    this.name = 'ApiProblem';
    this.status = init.status;
    this.code = init.code;
    this.errors = init.errors ?? [];
    this.retryAfterSeconds = init.retryAfterSeconds;
  }

  /** The code of the first entry naming `field`, if the problem names it. */
  fieldCode(field: string): string | undefined {
    return this.errors.find((entry) => entry.field === field)?.code;
  }
}

export function isApiProblem(failure: unknown): failure is ApiProblem {
  return failure instanceof ApiProblem;
}

/**
 * The `code` of whatever went wrong, when there is one. Anything that is not
 * an `ApiProblem` — a request the network never delivered, most of all — has
 * none, and `content/errorMessage.ts` words that as the general failure,
 * which is the truth: the dashboard does not know what happened.
 */
export function problemCode(failure: unknown): string | undefined {
  return isApiProblem(failure) ? failure.code : undefined;
}

/**
 * Whether a failure is an expired or missing Sign-in (`API.md`, "When a
 * Sign-in expires"). Read in two places — the session query, which turns it
 * into "nobody is signed in", and the sign-in cover the dashboard puts over
 * itself — so the check lives here rather than in either.
 */
export function isUnauthenticated(failure: unknown): boolean {
  return isApiProblem(failure) && failure.code === 'UNAUTHENTICATED';
}
