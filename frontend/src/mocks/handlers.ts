import { http, HttpResponse } from 'msw';

/**
 * The backend as described in ../../API.md, standing in until the real one
 * exists. These handlers are the executable version of that contract: if the
 * backend disagrees with them, one of the two documents is wrong.
 *
 * Tests override individual handlers to produce a specific failure; see
 * ../test/setup.ts.
 */

const seenSubmissionIds = new Map<string, string>();

export const DEMO_ONBOARDING_TOKEN = 'demo-onboarding-token';
export const INVALID_ONBOARDING_TOKEN = 'invalid-onboarding-token';

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

const onboardingStepsByToken = new Map<
  string,
  { name: string; steps: { id: string; done: boolean }[] }
>([
  [
    DEMO_ONBOARDING_TOKEN,
    {
      name: 'Tobias Hoffmann',
      steps: [
        { id: 'RULES', done: true },
        { id: 'COMMUNITY_GROUP', done: true },
        { id: 'DIGITAL_DEMOCRACY_LAB', done: false },
        { id: 'CONTACT', done: false },
      ],
    },
  ],
]);

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
    const body = (await request.json()) as {
      submissionId: string;
      website: string;
    };

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

  http.get('*/api/onboarding/:token', ({ params }) => {
    const token = String(params.token);
    const entry = onboardingStepsByToken.get(token);

    if (!entry) {
      return HttpResponse.json(
        {
          type: 'https://ichbinhier.eu/problems/not-found',
          title: 'Not found',
          status: 404,
          code: 'NOT_FOUND',
        },
        {
          status: 404,
          headers: { 'Content-Type': 'application/problem+json' },
        },
      );
    }

    return HttpResponse.json(entry);
  }),

  http.put(
    '*/api/onboarding/:token/steps/:stepId',
    async ({ params, request }) => {
      const token = String(params.token);
      const stepId = String(params.stepId);
      const entry = onboardingStepsByToken.get(token);

      if (!entry) {
        return HttpResponse.json(
          {
            type: 'https://ichbinhier.eu/problems/not-found',
            title: 'Not found',
            status: 404,
            code: 'NOT_FOUND',
          },
          {
            status: 404,
            headers: { 'Content-Type': 'application/problem+json' },
          },
        );
      }

      const body = (await request.json()) as { done?: unknown };

      if (!isBoolean(body.done)) {
        return validationProblem([
          { field: 'done', code: 'VALIDATION_FAILED' },
        ]);
      }

      const stepExists = entry.steps.some((step) => step.id === stepId);

      if (!stepExists) {
        return validationProblem([{ field: 'stepId', code: 'STEP_UNKNOWN' }]);
      }

      const doneValue = body.done;

      const updatedSteps = entry.steps.map((step) =>
        step.id === stepId ? { ...step, done: doneValue } : step,
      );

      const updated = { ...entry, steps: updatedSteps };
      onboardingStepsByToken.set(token, updated);

      return HttpResponse.json(updated);
    },
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
