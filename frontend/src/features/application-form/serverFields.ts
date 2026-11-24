import type { FormValues } from './schema';

/**
 * Which form field a server-sent error belongs under. The backend names fields
 * as they appear in the request body, and `categoryId` maps onto the form's
 * `route` field because the form asks one question where the API takes one
 * value.
 */
const SERVER_FIELD_TO_FORM_FIELD: Record<string, keyof FormValues> = {
  categoryId: 'route',
  name: 'name',
  email: 'email',
  weeklyTime: 'weeklyTime',
  about: 'about',
  privacyConsent: 'privacyConsent',
};

export function formFieldFor(serverField: string): keyof FormValues | null {
  return SERVER_FIELD_TO_FORM_FIELD[serverField] ?? null;
}
