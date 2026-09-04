import { http, HttpResponse } from 'msw';

import type { ApplicationRequest } from '../features/application-form/api';

/**
 * The backend as described in ../../API.md, standing in until the real one
 * exists. These handlers are the executable version of that contract: if the
 * backend disagrees with them, one of the two documents is wrong.
 *
 * Tests override individual handlers to produce a specific failure; see
 * ../test/setup.ts.
 */

const seenSubmissionIds = new Map<string, string>();

/** Stable ids so tests can assert against them without reading a response. */
export const MOCK_CATEGORIES = [
  { id: '11111111-1111-4111-8111-111111111111', label: 'Social Media' },
  {
    id: '22222222-2222-4222-8222-222222222222',
    label: 'Redaktion / Öffentlichkeitsarbeit',
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    label: 'Rechtliche Unterstützung',
  },
  { id: '44444444-4444-4444-8444-444444444444', label: 'Etwas anderes' },
];

export const handlers = [
  http.get('*/api/v1/categories', () =>
    HttpResponse.json({ categories: MOCK_CATEGORIES }),
  ),

  http.post('*/api/v1/applications', async ({ request }) => {
    const body = (await request.json()) as ApplicationRequest;

    // Honeypot filled means a bot: answer 201 and store nothing, so the bot
    // learns nothing from the response.
    if (body.website.length > 0) {
      return HttpResponse.json({ applicationId: 'discarded' }, { status: 201 });
    }

    // Idempotency: the same submissionId must not create a second application.
    const existing = seenSubmissionIds.get(body.submissionId);
    if (existing) {
      return HttpResponse.json({ applicationId: existing }, { status: 201 });
    }

    const applicationId = crypto.randomUUID();
    seenSubmissionIds.set(body.submissionId, applicationId);

    return HttpResponse.json({ applicationId }, { status: 201 });
  }),

  http.post(
    '*/api/v1/route-selections',
    () => new HttpResponse(null, { status: 202 }),
  ),
];

/** A 400 shaped like RFC 9457, for exercising server-side field errors. */
export function validationProblem(errors: { field: string; code: string }[]) {
  return HttpResponse.json(
    {
      type: 'https://ichbinhier.eu/problems/validation-failed',
      title: 'Validation failed',
      status: 400,
      code: 'VALIDATION_FAILED',
      errors,
    },
    { status: 400, headers: { 'Content-Type': 'application/problem+json' } },
  );
}
