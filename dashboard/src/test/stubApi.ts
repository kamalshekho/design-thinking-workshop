/**
 * The backend, stubbed at `fetch` and at `EventSource`.
 *
 * There is no Mock Service Worker (issue #29) and `src/data/` is fixtures
 * only, so a test that renders the whole application stubs the two globals
 * the wire uses and answers from those fixtures. It is deliberately stateful:
 * signing out has to make `GET /me` answer `401`, or the sign-out test would
 * sign straight back in.
 *
 * The `EventSource` is inert until a test drives it. Nothing fires `open` on
 * its own, so a test that does not care about the stream is not surprised by
 * the refetch every `open` triggers — and a test that does care fires it
 * itself.
 *
 * The writes really write, which is what makes a whole-application test worth
 * running: an optimistic discard that was never sent, or one the server
 * refused, both look identical on screen until the refetch behind them asks
 * this object what happened. `writeFailure` is how a test makes every write
 * fail, so the rollback and the one notice above the screens can be watched.
 */

import { vi } from 'vitest';

import {
  createMockApplications,
  mockCategories,
  mockOwners,
  mockStaffMember,
} from '@/data/mockApplications';
import type { Application, Owner } from '@/domain/application';
import type { Category } from '@/domain/category';
import type { StaffMember } from '@/domain/staffMember';
import type { StateChange } from '@/domain/stateChange';

export class StubEventSource {
  static latest: StubEventSource | null = null;

  /** The browser's own constants, which the hook reads off the global. */
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSED = 2;

  onopen: ((event: Event) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  closed = false;
  /**
   * Which of the two failures a test is driving. A dropped connection leaves
   * the source `CONNECTING` and the browser repairs it; a response — a `502`
   * or a `401` — leaves it `CLOSED` for good, and the hook has to reopen it
   * itself (`queries/useApplicationStream.ts`).
   */
  readyState: number = StubEventSource.CONNECTING;

  private readonly listeners = new Map<string, Set<EventListener>>();

  constructor(readonly url: string) {
    StubEventSource.latest = this;
  }

  addEventListener(type: string, listener: EventListener): void {
    const forType = this.listeners.get(type) ?? new Set<EventListener>();
    forType.add(listener);
    this.listeners.set(type, forType);
  }

  removeEventListener(type: string, listener: EventListener): void {
    this.listeners.get(type)?.delete(listener);
  }

  close(): void {
    this.closed = true;
    this.readyState = StubEventSource.CLOSED;
  }

  /** What the browser does when the stream connects, and on every reconnect. */
  fireOpen(): void {
    this.readyState = StubEventSource.OPEN;
    this.onopen?.(new Event('open'));
  }

  /** A dropped connection: the browser will try again by itself. */
  fireError(): void {
    this.readyState = StubEventSource.CONNECTING;
    this.onerror?.(new Event('error'));
  }

  /** A response the browser gives up on — a `502` or a `401`. */
  fireErrorAndClose(): void {
    this.readyState = StubEventSource.CLOSED;
    this.closed = true;
    this.onerror?.(new Event('error'));
  }

  /** One event, carrying the complete Application the contract promises. */
  emit(type: string, application: Application): void {
    const event = new MessageEvent(type, {
      data: JSON.stringify(application),
    });

    for (const listener of this.listeners.get(type) ?? []) {
      listener(event);
    }
  }
}

export type StubbedApi = {
  /** Flipped by `DELETE /session`, read by `GET /me`. */
  signedIn: boolean;
  applications: Application[];
  categories: Category[];
  owners: Owner[];
  changes: StateChange[];
  staffMember: StaffMember;
  /** What `POST /session` answers with instead of a Sign-in, when set. */
  signInFailure: { status: number; code: string } | null;
  /** What every write answers with instead of doing the work, when set. */
  writeFailure: { status: number; code: string } | null;
  /** The stream the application opened, once it has opened one. */
  stream: () => StubEventSource | null;
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

const NO_CONTENT = () => new Response(null, { status: 204 });

/** The reference date the fixtures and the application agree on. */
export const REFERENCE_DATE = new Date('2026-09-08T09:00:00Z');

export function stubApi(overrides: Partial<StubbedApi> = {}): StubbedApi {
  const api: StubbedApi = {
    signedIn: true,
    applications: createMockApplications(REFERENCE_DATE),
    categories: [...mockCategories],
    owners: [...mockOwners],
    changes: [],
    staffMember: mockStaffMember,
    signInFailure: null,
    writeFailure: null,
    stream: () => StubEventSource.latest,
    ...overrides,
  };

  StubEventSource.latest = null;
  vi.stubGlobal('EventSource', StubEventSource);

  vi.stubGlobal(
    'fetch',
    vi.fn((input: string | URL | Request, init?: RequestInit) => {
      const url = String(
        typeof input === 'string' || input instanceof URL ? input : input.url,
      );
      const method = init?.method ?? 'GET';

      const body = ((): Record<string, unknown> =>
        typeof init?.body === 'string'
          ? (JSON.parse(init.body) as Record<string, unknown>)
          : {})();
      /** The path under `/api/v1/staff`, so a route reads as it does in `API.md`. */
      const path = url.slice(url.indexOf('/staff') + '/staff'.length);

      if (path === '/session' && method === 'POST') {
        if (api.signInFailure !== null) {
          return Promise.resolve(
            problem(api.signInFailure.status, api.signInFailure.code),
          );
        }
        api.signedIn = true;
        return Promise.resolve(json(api.staffMember));
      }

      if (path === '/session' && method === 'DELETE') {
        api.signedIn = false;
        return Promise.resolve(NO_CONTENT());
      }

      if (!api.signedIn) {
        return Promise.resolve(problem(401, 'UNAUTHENTICATED'));
      }

      if (method !== 'GET' && api.writeFailure !== null) {
        return Promise.resolve(
          problem(api.writeFailure.status, api.writeFailure.code),
        );
      }

      if (path === '/me') {
        return Promise.resolve(json(api.staffMember));
      }

      if (path.startsWith('/applications/changes')) {
        return Promise.resolve(json({ changes: api.changes }));
      }

      if (path === '/applications') {
        return Promise.resolve(json({ applications: api.applications }));
      }

      if (path === '/members') {
        return Promise.resolve(
          json({
            members: api.owners.map((owner) => ({
              id: owner.id,
              name: owner.name,
            })),
          }),
        );
      }

      /**
       * `PATCH …/applications/{id}` — any subset of the four fields, and the
       * complete Application back. `discarded` is a boolean on the wire and a
       * timestamp on the row, stamped here the way the server stamps it.
       */
      const patched = /^\/applications\/([^/]+)$/.exec(path);
      if (patched !== null && method === 'PATCH') {
        const id = patched[1];
        const application = api.applications.find((row) => row.id === id);

        if (application === undefined) {
          return Promise.resolve(problem(404, 'NOT_FOUND'));
        }

        const { discarded, ...edit } = body;
        const updated: Application = {
          ...application,
          ...(edit as Partial<Application>),
          ...(discarded === undefined
            ? {}
            : {
                discardedAt:
                  discarded === true ? REFERENCE_DATE.toISOString() : null,
              }),
        };

        api.applications = api.applications.map((row) =>
          row.id === id ? updated : row,
        );
        return Promise.resolve(json(updated));
      }

      const erased = /^\/applications\/([^/]+)\/permanently$/.exec(path);
      if (erased !== null && method === 'DELETE') {
        const id = erased[1];
        const application = api.applications.find((row) => row.id === id);

        if (application === undefined) {
          return Promise.resolve(problem(404, 'NOT_FOUND'));
        }

        if (application.discardedAt === null) {
          return Promise.resolve(problem(400, 'NOT_DISCARDED'));
        }

        api.applications = api.applications.filter((row) => row.id !== id);
        api.changes = api.changes.filter(
          (change) => change.applicationId !== id,
        );
        return Promise.resolve(NO_CONTENT());
      }

      if (path === '/categories' && method === 'GET') {
        return Promise.resolve(json({ categories: api.categories }));
      }

      /** The id is the server's to mint, which is half of why this awaits it. */
      if (path === '/categories' && method === 'POST') {
        const created: Category = {
          id: crypto.randomUUID(),
          name: typeof body.name === 'string' ? body.name : '',
          description:
            typeof body.description === 'string' ? body.description : '',
          active: body.active !== false,
        };

        api.categories = [...api.categories, created];
        return Promise.resolve(json(created, 201));
      }

      if (path === '/categories/order' && method === 'PUT') {
        const ids = body.ids as string[];
        const byId = new Map(api.categories.map((row) => [row.id, row]));

        if (
          ids.length !== api.categories.length ||
          ids.some((id) => !byId.has(id))
        ) {
          return Promise.resolve(problem(400, 'VALIDATION_FAILED'));
        }

        api.categories = ids.flatMap((id) => {
          const category = byId.get(id);
          return category === undefined ? [] : [category];
        });
        return Promise.resolve(json({ categories: api.categories }));
      }

      const category = /^\/categories\/([^/]+)$/.exec(path);
      if (category !== null) {
        const id = category[1];
        const existing = api.categories.find((row) => row.id === id);

        if (existing === undefined) {
          return Promise.resolve(problem(404, 'NOT_FOUND'));
        }

        if (method === 'PATCH') {
          const updated = { ...existing, ...(body as Partial<Category>) };
          api.categories = api.categories.map((row) =>
            row.id === id ? updated : row,
          );
          return Promise.resolve(json(updated));
        }

        if (method === 'DELETE') {
          const named = api.applications.some((row) => row.categoryId === id);

          if (named) {
            return Promise.resolve(problem(409, 'CATEGORY_IN_USE'));
          }

          api.categories = api.categories.filter((row) => row.id !== id);
          return Promise.resolve(NO_CONTENT());
        }
      }

      return Promise.resolve(problem(404, 'NOT_FOUND'));
    }),
  );

  return api;
}
