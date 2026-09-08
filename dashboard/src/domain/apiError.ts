/**
 * The error `code`s the backend sends (`API.md`, "Errors"). Every failure
 * arrives as `application/problem+json` with a `code`; the backend never sends
 * German, so the code is what the dashboard words — once, in
 * `src/content/de.ts`, looked up through `src/content/errorMessage.ts`.
 *
 * The two lists exist so that a code added to the contract without a wording
 * fails `npm run typecheck` rather than reaching a Staff member as the general
 * fallback. They are not exhaustive of what can arrive: a status the contract
 * does not name carries the status's own name as its `code`
 * (`METHOD_NOT_ALLOWED`, `UNSUPPORTED_MEDIA_TYPE`, `BAD_REQUEST`), and every
 * one of those is a caller defect a Staff member cannot act on — the lookup
 * answers those with the general wording on purpose.
 */

/**
 * Codes that describe the request as a whole. `NOT_DISCARDED` sits here rather
 * than among the field codes: nothing in the request is wrong, the Application
 * is simply not on the fourth screen yet (`API.md`).
 */
export const TOP_LEVEL_ERROR_CODES = [
  'VALIDATION_FAILED',
  'NOT_DISCARDED',
  'INVALID_CREDENTIALS',
  'UNAUTHENTICATED',
  'NOT_FOUND',
  'CATEGORY_IN_USE',
  'RATE_LIMITED',
  'INTERNAL_ERROR',
] as const;

export type TopLevelErrorCode = (typeof TOP_LEVEL_ERROR_CODES)[number];

/** Codes that name one field, carried in the problem's `errors` array. */
export const FIELD_ERROR_CODES = [
  'STATUS_UNKNOWN',
  'OWNER_UNKNOWN',
  'NOTES_TOO_LONG',
  'CATEGORY_NAME_REQUIRED',
  'CATEGORY_NAME_TOO_LONG',
  'CATEGORY_NAME_TAKEN',
  'CATEGORY_DESCRIPTION_TOO_LONG',
  'ORDER_INCOMPLETE',
  'IMMUTABLE_FIELD',
] as const;

export type FieldErrorCode = (typeof FIELD_ERROR_CODES)[number];
