import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchApplications, fetchStateChanges } from './applications';

function answer(body: unknown) {
  const mock = vi.fn<(input: string, init?: RequestInit) => Promise<Response>>(
    () =>
      Promise.resolve(
        new Response(JSON.stringify(body), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
  );
  vi.stubGlobal('fetch', mock);
  return mock;
}

const wire = {
  id: 'a3f1c0de-4cde-4d61-830b-4af475f5727b',
  categoryId: '5c2b0000-0000-0000-0000-000000000000',
  name: 'Mara Weber',
  email: 'mara.weber@example.org',
  weeklyTime: 'HOURS_3_5',
  about: null,
  status: 'NEW',
  ownerId: null,
  internalNotes: '',
  discardedAt: null,
  consentAt: '2026-09-01T08:12:44Z',
  consentTextVersion: '2026-09',
  submittedAt: '2026-09-01T08:12:44Z',
};

describe('fetchApplications', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads the list out of its envelope, field for field', async () => {
    const mock = answer({ applications: [wire] });

    await expect(fetchApplications()).resolves.toEqual([wire]);
    expect(mock.mock.calls[0]?.[0]).toBe('/api/v1/staff/applications');
  });

  /**
   * `about` is `null` when the applicant wrote nothing, and `internalNotes` is
   * `""` when no Staff member has — two absences the backend really tells
   * apart (issue #33), so the mapping may not collapse them.
   */
  it('keeps a null about apart from an empty note', async () => {
    answer({
      applications: [{ ...wire, about: null, internalNotes: '' }],
    });

    const [application] = await fetchApplications();

    expect(application?.about).toBeNull();
    expect(application?.internalNotes).toBe('');
  });

  it('drops a field the contract does not name', async () => {
    answer({
      applications: [{ ...wire, submissionId: 'never-exposed' }],
    });

    const [application] = await fetchApplications();

    expect(application).not.toHaveProperty('submissionId');
  });

  it('takes an empty list as an empty list', async () => {
    answer({ applications: [] });

    await expect(fetchApplications()).resolves.toEqual([]);
  });
});

describe('fetchStateChanges', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('asks for the window the dashboard slices from', async () => {
    const mock = answer({ changes: [] });

    await fetchStateChanges();

    expect(mock.mock.calls[0]?.[0]).toBe(
      '/api/v1/staff/applications/changes?days=30',
    );
  });

  /** `to` is typed by `field`: a status, an id or `null`, or a boolean. */
  it('keeps each value at the type its field gives it', async () => {
    answer({
      changes: [
        {
          applicationId: 'a',
          at: '2026-09-04T09:31:02Z',
          field: 'STATUS',
          to: 'IN_REVIEW',
        },
        {
          applicationId: 'a',
          at: '2026-09-04T09:31:02Z',
          field: 'OWNER',
          to: null,
        },
        {
          applicationId: 'b',
          at: '2026-09-05T14:02:55Z',
          field: 'DISCARDED',
          to: true,
        },
      ],
    });

    const changes = await fetchStateChanges();

    expect(changes.map((change) => change.to)).toEqual([
      'IN_REVIEW',
      null,
      true,
    ]);
  });
});
