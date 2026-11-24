/**
 * Every error the form can show, as a machine code. Codes are produced by the
 * zod schema and by the backend (see API.md); German text is looked up once, in
 * ../content/de.ts.
 *
 * Adding a code here without adding its text there is a type error — which is
 * the point.
 */
const FIELD_ERROR_CODES = [
  'ROUTE_REQUIRED',
  'CATEGORY_REQUIRED',
  'CATEGORY_UNKNOWN',
  'CATEGORY_UNAVAILABLE',
  'NAME_REQUIRED',
  'NAME_TOO_LONG',
  'EMAIL_REQUIRED',
  'EMAIL_INVALID',
  'EMAIL_TOO_LONG',
  'WEEKLY_TIME_REQUIRED',
  'WEEKLY_TIME_UNKNOWN',
  'ABOUT_TOO_LONG',
  'CONSENT_REQUIRED',
] as const;

const SUBMIT_ERROR_CODES = ['RATE_LIMITED', 'INTERNAL_ERROR'] as const;

type FieldErrorCode = (typeof FIELD_ERROR_CODES)[number];

export type SubmitErrorCode = (typeof SUBMIT_ERROR_CODES)[number];

export type ErrorCode = FieldErrorCode | SubmitErrorCode;

const ERROR_CODES: readonly ErrorCode[] = [
  ...FIELD_ERROR_CODES,
  ...SUBMIT_ERROR_CODES,
];

export function isErrorCode(value: string): value is ErrorCode {
  return ERROR_CODES.some((code) => code === value);
}
