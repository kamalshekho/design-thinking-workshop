import type { FormValues } from './schema';

/**
 * Every error the form can show, as a machine code. Codes are produced by the
 * zod schema and by the backend (see API.md); German text is looked up once, in
 * ../../content/de.ts.
 *
 * Adding a code here without adding its text there is a type error — which is
 * the point.
 */
export const FIELD_ERROR_CODES = [
  'ROUTE_REQUIRED',
  'CATEGORY_REQUIRED',
  'CATEGORY_UNKNOWN',
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

export type FieldErrorCode = (typeof FIELD_ERROR_CODES)[number];

export const SUBMIT_ERROR_CODES = ['RATE_LIMITED', 'INTERNAL_ERROR'] as const;

export type SubmitErrorCode = (typeof SUBMIT_ERROR_CODES)[number];

export type ErrorCode = FieldErrorCode | SubmitErrorCode;

/**
 * Which form field a server-sent error belongs under. The backend names fields
 * as they appear in the request body, and `category` maps onto the form's
 * `route` field because the form asks one question where the API takes one
 * value.
 */
const SERVER_FIELD_TO_FORM_FIELD: Record<string, keyof FormValues> = {
  category: 'route',
  name: 'name',
  email: 'email',
  weeklyTime: 'weeklyTime',
  about: 'about',
  privacyConsent: 'privacyConsent',
};

export function formFieldFor(serverField: string): keyof FormValues | null {
  return SERVER_FIELD_TO_FORM_FIELD[serverField] ?? null;
}

export function isFieldErrorCode(code: string): code is FieldErrorCode {
  return (FIELD_ERROR_CODES as readonly string[]).includes(code);
}
