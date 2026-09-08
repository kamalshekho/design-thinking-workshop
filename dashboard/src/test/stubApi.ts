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

  onopen: ((event: Event) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  closed = false;

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
  }

  /** What the browser does when the stream connects, and on every reconnect. */
  fireOpen(): void {
    this.onopen?.(new Event('open'));
  }

  fireError(): void {
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

      if (url.endsWith('/staff/session') && method === 'POST') {
        if (api.signInFailure !== null) {
          return Promise.resolve(
            problem(api.signInFailure.status, api.signInFailure.code),
          );
        }
        api.signedIn = true;
        return Promise.resolve(json(api.staffMember));
      }

      if (url.endsWith('/staff/session') && method === 'DELETE') {
        api.signedIn = false;
        return Promise.resolve(new Response(null, { status: 204 }));
      }

      if (!api.signedIn) {
        return Promise.resolve(problem(401, 'UNAUTHENTICATED'));
      }

      if (url.endsWith('/staff/me')) {
        return Promise.resolve(json(api.staffMember));
      }

      if (url.includes('/staff/applications/changes')) {
        return Promise.resolve(json({ changes: api.changes }));
      }

      if (url.endsWith('/staff/applications')) {
        return Promise.resolve(json({ applications: api.applications }));
      }

      if (url.endsWith('/staff/categories')) {
        return Promise.resolve(json({ categories: api.categories }));
      }

      if (url.endsWith('/staff/members')) {
        return Promise.resolve(
          json({
            members: api.owners.map((owner) => ({
              id: owner.id,
              name: owner.name,
            })),
          }),
        );
      }

      return Promise.resolve(problem(404, 'NOT_FOUND'));
    }),
  );

  return api;
}
