import { describe, expect, it } from 'vitest';

import { emptyFormValues, formSchema } from './schema';

/**
 * Reference test. It exists to prove the test setup works and to show the
 * shape a test in this project takes; the ported form will bring its own.
 *
 * Note what is asserted: the error *code*, never the German text. Copy is
 * reviewed against DESIGN.md, not against test expectations.
 */
function codesFor(values: unknown): string[] {
  const result = formSchema.safeParse(values);
  return result.success
    ? []
    : result.error.issues.map((issue) => issue.message);
}

describe('form schema', () => {
  it('requires a route before anything else', () => {
    expect(codesFor(emptyFormValues)).toEqual(['ROUTE_REQUIRED']);
  });

  it('asks for nothing beyond the route on a bypass route', () => {
    expect(codesFor({ ...emptyFormValues, route: 'COMMUNITY' })).toEqual([]);
    expect(
      codesFor({ ...emptyFormValues, route: 'SUPPORTING_MEMBER' }),
    ).toEqual([]);
  });

  it('requires the four application fields on a Vereinsarbeit route', () => {
    expect(codesFor({ ...emptyFormValues, route: 'SOCIAL_MEDIA' })).toEqual([
      'NAME_REQUIRED',
      'EMAIL_REQUIRED',
      'WEEKLY_TIME_REQUIRED',
      'CONSENT_REQUIRED',
    ]);
  });

  it('rejects an address it could not reply to', () => {
    expect(
      codesFor({
        ...emptyFormValues,
        route: 'SOCIAL_MEDIA',
        name: 'Anna Müller',
        email: 'anna@',
        weeklyTime: 'HOURS_1_2',
        privacyConsent: true,
      }),
    ).toEqual(['EMAIL_INVALID']);
  });

  it('accepts a complete application without the optional field', () => {
    expect(
      codesFor({
        ...emptyFormValues,
        route: 'LEGAL_SUPPORT',
        name: 'Anna Müller',
        email: 'anna@example.de',
        weeklyTime: 'IRREGULAR',
        privacyConsent: true,
      }),
    ).toEqual([]);
  });
});
