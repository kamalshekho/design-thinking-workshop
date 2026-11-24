import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as z from 'zod/v4-mini';

import { ApiProblem, isUnauthenticated } from './problem';
import { request, requestNoContent } from './transport';

const anyObjectSchema = z.object({});

function respond(body: unknown, init: ResponseInit = {}): Response {
  return new Response(body === null ? null : JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
}

function fetchMock(response: Response) {
  const mock = vi.fn<(input: string, init?: RequestInit) => Promise<Response>>(
    () => Promise.resolve(response),
  );
  vi.stubGlobal('fetch', mock);
  return mock;
}

describe('request', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends the Sign-in cookie and asks for nothing from a cache', async () => {
    const mock = fetchMock(respond({ ok: true }));

    await request('GET', '/applications', z.object({ ok: z.boolean() }));

    expect(mock).toHaveBeenCalledWith(
      '/api/v1/staff/applications',
      expect.objectContaining({
        method: 'GET',
        credentials: 'same-origin',
        cache: 'no-store',
      }),
    );
  });

  it('sends a body as JSON and says so, and nothing when there is none', async () => {
    const withBody = fetchMock(respond({}));
    await request('POST', '/session', anyObjectSchema, {
      email: 'a@b.de',
      password: 'geheim',
    });

    const [, sent] = withBody.mock.calls[0] ?? [];
    expect(sent?.body).toBe('{"email":"a@b.de","password":"geheim"}');
    expect(sent?.headers).toMatchObject({
      'Content-Type': 'application/json',
    });

    const withoutBody = fetchMock(respond({}));
    await request('GET', '/me', anyObjectSchema);

    const [, plain] = withoutBody.mock.calls[0] ?? [];
    expect(plain?.body).toBeUndefined();
    expect(plain?.headers).not.toHaveProperty('Content-Type');
  });

  it('answers a 204 with nothing rather than failing to parse it', async () => {
    fetchMock(respond(null, { status: 204 }));

    await expect(
      requestNoContent('DELETE', '/session'),
    ).resolves.toBeUndefined();
  });

  it('throws an ApiProblem without code when a 200 body does not match the schema', async () => {
    fetchMock(respond({ unexpected: true }));

    const failure = await request(
      'GET',
      '/applications',
      z.object({ ok: z.boolean() }),
    ).catch((thrown: unknown) => thrown);

    expect(failure).toBeInstanceOf(ApiProblem);
    if (failure instanceof ApiProblem) {
      expect(failure.status).toBe(200);
      expect(failure.code).toBeUndefined();
    }
  });

  /**
   * The decoding the whole error contract rests on: a `code` the dashboard
   * words, the `errors` array read next to the fields it names, and
   * `Retry-After` off the header rather than the body.
   */
  it('throws the problem a failed response carries', async () => {
    fetchMock(
      respond(
        {
          type: 'https://ichbinhier.eu/problems/validation-failed',
          title: 'Validation failed',
          status: 422,
          code: 'VALIDATION_FAILED',
          errors: [{ field: 'internalNotes', code: 'NOTES_TOO_LONG' }],
        },
        {
          status: 422,
          headers: {
            'Content-Type': 'application/problem+json',
            'Retry-After': '300',
          },
        },
      ),
    );

    const failure = await request(
      'PATCH',
      '/applications/1',
      anyObjectSchema,
      {},
    ).catch((thrown: unknown) => thrown);

    expect(failure).toBeInstanceOf(ApiProblem);
    if (!(failure instanceof ApiProblem)) {
      return;
    }

    expect(failure.status).toBe(422);
    expect(failure.code).toBe('VALIDATION_FAILED');
    expect(failure.fieldCode('internalNotes')).toBe('NOTES_TOO_LONG');
    expect(failure.fieldCode('status')).toBeUndefined();
    expect(failure.retryAfterSeconds).toBe(300);
  });

  it('recognises an expired Sign-in', async () => {
    fetchMock(
      respond(
        { status: 401, code: 'UNAUTHENTICATED' },
        {
          status: 401,
          headers: { 'Content-Type': 'application/problem+json' },
        },
      ),
    );

    const failure = await request('GET', '/me', anyObjectSchema).catch(
      (thrown: unknown) => thrown,
    );

    expect(isUnauthenticated(failure)).toBe(true);
  });

  /**
   * A body that is not the JSON it claimed to be still has to reach the
   * screen as a failure with a status, not as a syntax error — an nginx error
   * page in front of a restarting backend is exactly this case.
   */
  it('keeps the status when the body is not the problem it promised', async () => {
    fetchMock(
      new Response('<html>502</html>', {
        status: 502,
        headers: { 'Content-Type': 'text/html' },
      }),
    );

    const failure = await request(
      'GET',
      '/applications',
      anyObjectSchema,
    ).catch((thrown: unknown) => thrown);

    expect(failure).toBeInstanceOf(ApiProblem);
    if (failure instanceof ApiProblem) {
      expect(failure.status).toBe(502);
      expect(failure.code).toBeUndefined();
      expect(failure.errors).toEqual([]);
    }
  });
});
