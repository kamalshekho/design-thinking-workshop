import { afterEach, describe, expect, it, vi } from 'vitest';

import { isApiProblem } from './problem';
import { fetchSignedInStaffMember, signIn, signOut } from './session';

function stub(response: Response) {
  const mock = vi.fn<(input: string, init?: RequestInit) => Promise<Response>>(
    () => Promise.resolve(response),
  );
  vi.stubGlobal('fetch', mock);
  return mock;
}

function json(body: unknown, status = 200, contentType = 'application/json') {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': contentType },
  });
}

const staffMember = {
  id: 'e0d10000-0000-0000-0000-000000000000',
  name: 'Ashton Blackwell',
  email: 'ashton.blackwell@ichbinhier.online',
};

describe('the Sign-in', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('asks GET /me who is signed in', async () => {
    const mock = stub(json(staffMember));

    await expect(fetchSignedInStaffMember()).resolves.toEqual(staffMember);
    expect(mock.mock.calls[0]?.[0]).toBe('/api/v1/staff/me');
  });

  it('throws UNAUTHENTICATED when there is no Sign-in', async () => {
    stub(
      json(
        { status: 401, code: 'UNAUTHENTICATED' },
        401,
        'application/problem+json',
      ),
    );

    const failure = await fetchSignedInStaffMember().catch(
      (thrown: unknown) => thrown,
    );

    expect(isApiProblem(failure) && failure.code).toBe('UNAUTHENTICATED');
  });

  it('posts the credentials and takes the Staff member from the response', async () => {
    const mock = stub(json(staffMember));

    await expect(
      signIn({ email: staffMember.email, password: 'geheim' }),
    ).resolves.toEqual(staffMember);

    const [url, init] = mock.mock.calls[0] ?? [];
    expect(url).toBe('/api/v1/staff/session');
    expect(init?.method).toBe('POST');
  });

  /** No avatar reaches the domain type: the wire carries none (`API.md`). */
  it('keeps a field the contract does not name off the Staff member', async () => {
    stub(json({ ...staffMember, avatar: 'https://example.org/photo.webp' }));

    await expect(fetchSignedInStaffMember()).resolves.toEqual(staffMember);
  });

  it('ends the Sign-in on a 204 with no body', async () => {
    const mock = stub(new Response(null, { status: 204 }));

    await expect(signOut()).resolves.toBeUndefined();
    expect(mock.mock.calls[0]?.[1]?.method).toBe('DELETE');
  });
});
