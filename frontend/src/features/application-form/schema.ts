import { z } from 'zod';

import { isUuid } from '../../lib/uuid';
import { isFixedRoute, WEEKLY_TIME_OPTIONS } from './routes';

/**
 * Validation rules for the form. This schema is the only place a rule lives —
 * a component must never re-check a length or a format.
 *
 * Every message is an **error code**, not German text. Codes are translated in
 * ../../content/de.ts, which means client-side and server-side errors take the
 * exact same rendering path and cannot drift in wording. The limits below are a
 * contract with the backend; see API.md.
 */

export const NAME_MAX = 120;
export const EMAIL_MAX = 254;
export const ABOUT_MAX = 2000;

export const formSchema = z
  .object({
    /**
     * Empty until the applicant picks a route or a category. This only
     * checks shape — a fixed route or something that looks like a category
     * UUID. Whether a UUID names a category the backend actually still
     * offers is checked against the loaded list at submit time (see
     * useApplicationSubmit.ts), because that list is not known when this
     * schema is built.
     */
    route: z.literal('').or(z.string()),
    name: z.string().trim().max(NAME_MAX, 'NAME_TOO_LONG'),
    email: z.string().trim().max(EMAIL_MAX, 'EMAIL_TOO_LONG'),
    weeklyTime: z.literal('').or(z.enum(WEEKLY_TIME_OPTIONS)),
    about: z.string().trim().max(ABOUT_MAX, 'ABOUT_TOO_LONG'),
    privacyConsent: z.boolean(),
    /**
     * Honeypot. A real browser always submits this empty; a bot fills it in.
     * Deliberately not validated here — the submission goes through and the
     * backend discards it silently, so the bot learns nothing (see API.md).
     */
    website: z.string(),
  })
  .superRefine((values, ctx) => {
    if (values.route === '') {
      ctx.addIssue({
        code: 'custom',
        path: ['route'],
        message: 'ROUTE_REQUIRED',
      });
      return;
    }

    // The two bypass routes submit nothing, so none of the fields below apply.
    if (isFixedRoute(values.route)) return;

    if (!isUuid(values.route)) {
      ctx.addIssue({
        code: 'custom',
        path: ['route'],
        message: 'CATEGORY_UNKNOWN',
      });
      return;
    }

    if (values.name.length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['name'],
        message: 'NAME_REQUIRED',
      });
    }

    if (values.email.length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['email'],
        message: 'EMAIL_REQUIRED',
      });
    } else if (!z.email().safeParse(values.email).success) {
      ctx.addIssue({
        code: 'custom',
        path: ['email'],
        message: 'EMAIL_INVALID',
      });
    }

    if (values.weeklyTime === '') {
      ctx.addIssue({
        code: 'custom',
        path: ['weeklyTime'],
        message: 'WEEKLY_TIME_REQUIRED',
      });
    }

    if (!values.privacyConsent) {
      ctx.addIssue({
        code: 'custom',
        path: ['privacyConsent'],
        message: 'CONSENT_REQUIRED',
      });
    }
  });

export type FormValues = z.input<typeof formSchema>;

export const emptyFormValues: FormValues = {
  route: '',
  name: '',
  email: '',
  weeklyTime: '',
  about: '',
  privacyConsent: false,
  website: '',
};

/**
 * Narrowed view of the values once they belong to an application. Guarding on
 * this keeps the request builder free of empty-string and fixed-route cases
 * that the form can no longer be in by the time submit is reachable. `route`
 * is a category id here — whether it names a category the backend still
 * offers is checked separately, against the loaded list (see
 * useApplicationSubmit.ts).
 */
export type ApplicationValues = FormValues & {
  route: string;
  weeklyTime: (typeof WEEKLY_TIME_OPTIONS)[number];
  privacyConsent: true;
};

export function asApplicationValues(
  values: FormValues,
): ApplicationValues | null {
  if (values.route === '' || isFixedRoute(values.route)) return null;
  if (values.weeklyTime === '') return null;
  if (!values.privacyConsent) return null;
  return {
    ...values,
    route: values.route,
    weeklyTime: values.weeklyTime,
    privacyConsent: true,
  };
}
