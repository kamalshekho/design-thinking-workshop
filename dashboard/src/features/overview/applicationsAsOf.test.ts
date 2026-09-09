import { describe, expect, it } from 'vitest';

import type { Application } from '@/domain/application';
import type { StateChange } from '@/domain/stateChange';

import { applicationsAsOf } from './applicationsAsOf';

function application(overrides: Partial<Application> = {}): Application {
  return {
    id: 'a1',
    name: 'Mara Weber',
    email: 'mara.weber@example.org',
    submittedAt: '2026-09-01T09:00:00.000Z',
    categoryId: 'social-media',
    weeklyTime: 'HOURS_3_5',
    status: 'NEW',
    ownerId: null,
    about: 'Ich möchte mithelfen.',
    internalNotes: '',
    discardedAt: null,
    consentAt: '2026-09-01T09:00:00.000Z',
    consentTextVersion: '2026-09',
    ...overrides,
  };
}

function change(overrides: Partial<StateChange> = {}): StateChange {
  return {
    applicationId: 'a1',
    at: '2026-09-05T09:00:00.000Z',
    field: 'STATUS',
    to: 'IN_REVIEW',
    ...overrides,
  };
}

const SEPTEMBER_3 = new Date('2026-09-03T12:00:00.000Z');
const SEPTEMBER_7 = new Date('2026-09-07T12:00:00.000Z');

describe('applicationsAsOf', () => {
  it('leaves out an Application submitted after the day', () => {
    const applications = [
      application({ id: 'early', submittedAt: '2026-09-01T09:00:00.000Z' }),
      application({ id: 'late', submittedAt: '2026-09-06T09:00:00.000Z' }),
    ];

    expect(
      applicationsAsOf(applications, [], SEPTEMBER_3).map((entry) => entry.id),
    ).toEqual(['early']);
  });

  it('keeps the current value where nothing changed after the day', () => {
    const applications = [
      application({ status: 'ACTIVE', ownerId: 'staff-2' }),
    ];

    const [entry] = applicationsAsOf(applications, [], SEPTEMBER_3);

    expect(entry?.status).toBe('ACTIVE');
    expect(entry?.ownerId).toBe('staff-2');
  });

  it('reads a status back to what it was before a later change', () => {
    const applications = [application({ status: 'ACTIVE' })];
    const changes = [
      change({ at: '2026-09-02T09:00:00.000Z', to: 'IN_REVIEW' }),
      change({ at: '2026-09-05T09:00:00.000Z', to: 'ACTIVE' }),
    ];

    expect(
      applicationsAsOf(applications, changes, SEPTEMBER_3)[0]?.status,
    ).toBe('IN_REVIEW');
  });

  it('reads a status back to NEW before its first change', () => {
    const applications = [application({ status: 'ACTIVE' })];
    const changes = [change({ at: '2026-09-05T09:00:00.000Z', to: 'ACTIVE' })];

    expect(
      applicationsAsOf(applications, changes, SEPTEMBER_3)[0]?.status,
    ).toBe('NEW');
  });

  it('reads an Owner back to nobody before the Application was assigned', () => {
    const applications = [application({ ownerId: 'staff-2' })];
    const changes = [
      change({ at: '2026-09-05T09:00:00.000Z', field: 'OWNER', to: 'staff-2' }),
    ];

    expect(
      applicationsAsOf(applications, changes, SEPTEMBER_3)[0]?.ownerId,
    ).toBeNull();
  });

  it('reads a cleared Owner back to the Staff member who held it', () => {
    const applications = [application({ ownerId: null })];
    const changes = [
      change({ at: '2026-09-02T09:00:00.000Z', field: 'OWNER', to: 'staff-2' }),
      change({ at: '2026-09-05T09:00:00.000Z', field: 'OWNER', to: null }),
    ];

    expect(
      applicationsAsOf(applications, changes, SEPTEMBER_3)[0]?.ownerId,
    ).toBe('staff-2');
  });

  it('counts an Application discarded later as still on the working list', () => {
    const applications = [
      application({ discardedAt: '2026-09-05T09:00:00.000Z' }),
    ];
    const changes = [
      change({
        at: '2026-09-05T09:00:00.000Z',
        field: 'DISCARDED',
        to: true,
      }),
    ];

    expect(
      applicationsAsOf(applications, changes, SEPTEMBER_3)[0]?.discardedAt,
    ).toBeNull();
  });

  it('dates a restored Application by the row that discarded it', () => {
    const applications = [application({ discardedAt: null })];
    const changes = [
      change({
        at: '2026-09-02T09:00:00.000Z',
        field: 'DISCARDED',
        to: true,
      }),
      change({
        at: '2026-09-05T09:00:00.000Z',
        field: 'DISCARDED',
        to: false,
      }),
    ];

    expect(
      applicationsAsOf(applications, changes, SEPTEMBER_3)[0]?.discardedAt,
    ).toBe('2026-09-02T09:00:00.000Z');
  });

  it('walks each field on its own when one request changed two', () => {
    const applications = [
      application({ status: 'ACTIVE', ownerId: 'staff-2' }),
    ];
    const changes = [
      change({ at: '2026-09-05T09:00:00.000Z', to: 'ACTIVE' }),
      change({ at: '2026-09-05T09:00:00.000Z', field: 'OWNER', to: 'staff-2' }),
    ];

    const [entry] = applicationsAsOf(applications, changes, SEPTEMBER_3);

    expect(entry?.status).toBe('NEW');
    expect(entry?.ownerId).toBeNull();
  });

  it('leaves another Application alone', () => {
    const applications = [
      application({ id: 'a1', status: 'ACTIVE' }),
      application({ id: 'a2', status: 'WAITLISTED' }),
    ];
    const changes = [
      change({ applicationId: 'a1', at: '2026-09-05T09:00:00.000Z' }),
    ];

    expect(
      applicationsAsOf(applications, changes, SEPTEMBER_3)[1]?.status,
    ).toBe('WAITLISTED');
  });

  it('hands back the current list for today, so the card and its curve agree', () => {
    const applications = [
      application({ id: 'a1', status: 'ACTIVE', ownerId: 'staff-2' }),
      application({ id: 'a2', discardedAt: '2026-09-05T09:00:00.000Z' }),
    ];
    const changes = [
      change({ at: '2026-09-05T09:00:00.000Z', to: 'ACTIVE' }),
      change({
        applicationId: 'a2',
        at: '2026-09-05T09:00:00.000Z',
        field: 'DISCARDED',
        to: true,
      }),
    ];

    expect(applicationsAsOf(applications, changes, SEPTEMBER_7)).toEqual(
      applications,
    );
  });
});
