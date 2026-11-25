import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '../../mocks/server';
import { fetchOnboarding, updateOnboardingStep } from './api';

describe('onboarding api', () => {
  it('returns failed when GET responds with a malformed payload or invalid JSON', async () => {
    server.use(
      http.get('*/api/onboarding/:token', () =>
        HttpResponse.json({
          name: '',
          steps: [{ id: 'UNKNOWN', done: 'yes' }],
        }),
      ),
    );

    expect(await fetchOnboarding('token-1')).toEqual({ status: 'failed' });

    server.use(
      http.get(
        '*/api/onboarding/:token',
        () => new HttpResponse('not json', { status: 200 }),
      ),
    );

    expect(await fetchOnboarding('token-1')).toEqual({ status: 'failed' });
  });

  it('returns failed on network error or 500 and not-found on 404', async () => {
    server.use(http.get('*/api/onboarding/:token', () => HttpResponse.error()));

    expect(await fetchOnboarding('token-1')).toEqual({ status: 'failed' });

    server.use(
      http.get(
        '*/api/onboarding/:token',
        () => new HttpResponse(null, { status: 500 }),
      ),
    );

    expect(await fetchOnboarding('token-1')).toEqual({ status: 'failed' });

    server.use(
      http.get(
        '*/api/onboarding/:token',
        () => new HttpResponse(null, { status: 404 }),
      ),
    );

    expect(await fetchOnboarding('token-1')).toEqual({ status: 'not-found' });
  });

  it('returns failed when PUT responds with a malformed payload', async () => {
    server.use(
      http.put('*/api/onboarding/:token/steps/:stepId', () =>
        HttpResponse.json({ unexpected: true }),
      ),
    );

    expect(await updateOnboardingStep('token-1', 'RULES', true)).toEqual({
      status: 'failed',
    });
  });
});
