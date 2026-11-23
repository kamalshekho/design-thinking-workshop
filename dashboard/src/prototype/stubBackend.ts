/**
 * PROTOTYPE (issue #109), throwaway. An in-memory backend in the browser, so
 * `npm run prototype` needs no compose stack and shows no real Application.
 *
 * Answers the same routes as `src/test/stubApi.ts`, built on the same test
 * fixtures plus a few rows with long names. Writes change memory only; a
 * reload starts over.
 */

import type { Application, Owner } from '@/domain/application';
import type { Category } from '@/domain/category';
import {
  createMockApplications,
  mockCategories,
  mockOwners,
  mockStaffMember,
} from '@/test/mockApplications';
import { MILLISECONDS_PER_DAY } from '@/utils/dates';

const now = new Date();

const extraRows: [
  string,
  string,
  Application['status'],
  string | null,
  number,
][] = [
  [
    'Maximilian-Alexander von Hohenzollern-Sigmaringen',
    'legal',
    'NEW',
    null,
    0,
  ],
  ['Ayşe Nur Yıldırım-Schneider', 'social-media', 'IN_REVIEW', 'staff-3', 2],
  ['Ole Brandt', 'editorial', 'NEW', null, 3],
  [
    'Friederike Charlotte Lindenberg',
    'social-media',
    'WAITLISTED',
    'staff-2',
    6,
  ],
  ['Tim Ng', 'legal', 'INTRO_BOOKED', 'staff-4', 9],
  ['Konstantin Papadopoulos', 'editorial', 'NEW', null, 12],
  ['Sophie Wagner', 'social-media', 'ACTIVE', 'staff-1', 15],
];

function extras(): Application[] {
  return extraRows.map(
    ([name, categoryId, status, ownerId, daysAgo], index) => {
      const submittedAt = new Date(
        now.getTime() - daysAgo * MILLISECONDS_PER_DAY - index * 3_600_000,
      ).toISOString();
      return {
        id: `prototype-${String(index + 1)}`,
        name,
        email: `${(name.split(' ')[0] ?? name).toLowerCase()}.beispiel@example.org`,
        submittedAt,
        categoryId,
        weeklyTime: 'HOURS_3_5',
        status,
        ownerId,
        about:
          'Ich habe eure Arbeit in den Kommentarspalten verfolgt und möchte mithelfen. Abends und am Wochenende habe ich Zeit, unter der Woche eher selten.',
        internalNotes: '',
        discardedAt: null,
        consentAt: submittedAt,
        consentTextVersion: '2026-09',
      };
    },
  );
}

const db = {
  applications: [...createMockApplications(now), ...extras()],
  categories: [...mockCategories] as Category[],
  owners: [
    ...mockOwners,
    { id: 'staff-3', name: 'Lina Hoffmann' },
    { id: 'staff-4', name: 'Deniz Kaya' },
    { id: 'staff-5', name: 'Paula Richter' },
  ] as Owner[],
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function problem(status: number, code: string): Response {
  return new Response(JSON.stringify({ status, code }), {
    status,
    headers: { 'Content-Type': 'application/problem+json' },
  });
}

const realFetch = window.fetch.bind(window);

window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(
    typeof input === 'string' || input instanceof URL ? input : input.url,
  );
  if (!url.includes('/api/v1/staff')) {
    return realFetch(input, init);
  }

  const method = init?.method ?? 'GET';
  const body =
    typeof init?.body === 'string'
      ? (JSON.parse(init.body) as Record<string, unknown>)
      : {};
  const path =
    url.slice(url.indexOf('/staff') + '/staff'.length).split('?')[0] ?? '';

  const answer = ((): Response => {
    if (path === '/me' || path === '/session') {
      return json(mockStaffMember);
    }
    if (path.startsWith('/applications/changes')) {
      return json({ changes: [] });
    }
    if (path === '/applications') {
      return json({ applications: db.applications });
    }
    if (path === '/members') {
      return json({ members: db.owners });
    }
    const patched = /^\/applications\/([^/]+)$/.exec(path);
    if (patched !== null && method === 'PATCH') {
      const { discarded, ...edit } = body;
      let updated: Application | undefined;
      db.applications = db.applications.map((row) => {
        if (row.id !== (patched[1] ?? '')) {
          return row;
        }
        updated = {
          ...row,
          ...(edit as Partial<Application>),
          ...(discarded === undefined
            ? {}
            : {
                discardedAt:
                  discarded === true ? new Date().toISOString() : null,
              }),
        };
        return updated;
      });
      return updated === undefined ? problem(404, 'NOT_FOUND') : json(updated);
    }
    const erased = /^\/applications\/([^/]+)\/permanently$/.exec(path);
    if (erased !== null && method === 'DELETE') {
      db.applications = db.applications.filter(
        (row) => row.id !== (erased[1] ?? ''),
      );
      return new Response(null, { status: 204 });
    }
    if (path === '/categories' && method === 'GET') {
      return json({ categories: db.categories });
    }
    if (path === '/categories' && method === 'POST') {
      const created: Category = {
        id: crypto.randomUUID(),
        name: typeof body.name === 'string' ? body.name : '',
        description:
          typeof body.description === 'string' ? body.description : '',
        active: body.active !== false,
      };
      db.categories = [...db.categories, created];
      return json(created, 201);
    }
    if (path === '/categories/order' && method === 'PUT') {
      const ids = body.ids as string[];
      db.categories = ids.flatMap(
        (id) => db.categories.find((row) => row.id === id) ?? [],
      );
      return json({ categories: db.categories });
    }
    const category = /^\/categories\/([^/]+)$/.exec(path);
    if (category !== null && method === 'PATCH') {
      let updated: Category | undefined;
      db.categories = db.categories.map((row) => {
        if (row.id !== (category[1] ?? '')) {
          return row;
        }
        updated = { ...row, ...(body as Partial<Category>) };
        return updated;
      });
      return json(updated);
    }
    if (category !== null && method === 'DELETE') {
      if (
        db.applications.some((row) => row.categoryId === (category[1] ?? ''))
      ) {
        return problem(409, 'CATEGORY_IN_USE');
      }
      db.categories = db.categories.filter(
        (row) => row.id !== (category[1] ?? ''),
      );
      return new Response(null, { status: 204 });
    }
    return problem(404, 'NOT_FOUND');
  })();

  return Promise.resolve(answer);
};

/** A stream that opens once and never sends, so the marker reads "Live". */
class SilentEventSource extends EventTarget {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSED = 2;
  readyState = 0;
  onopen: ((event: Event) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(readonly url: string) {
    super();
    window.setTimeout(() => {
      this.readyState = 1;
      this.onopen?.(new Event('open'));
    }, 50);
  }

  close(): void {
    this.readyState = 2;
  }
}

window.EventSource = SilentEventSource as unknown as typeof EventSource;
