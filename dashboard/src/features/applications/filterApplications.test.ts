import { describe, expect, it } from 'vitest';

import type { Application } from '@/domain/application';

import { EMPTY_FILTERS, filterApplications } from './filterApplications';

const NOW = new Date('2026-09-05T12:00:00.000Z');

function application(overrides: Partial<Application> = {}): Application {
  return {
    id: 'a1',
    name: 'Mara Weber',
    email: 'mara.weber@example.org',
    submittedAt: '2026-09-04T09:00:00.000Z',
    categoryId: 'social-media',
    weeklyTime: 'HOURS_3_5',
    status: 'NEW',
    ownerId: null,
    about: 'Ich möchte mithelfen.',
    internalNotes: '',
    discardedAt: null,
    consentAt: '2026-09-04T09:00:00.000Z',
    consentTextVersion: '2026-09',
    ...overrides,
  };
}

describe('filterApplications', () => {
  it('returns every Application under the default filters', () => {
    const applications = [application({ id: 'a1' }), application({ id: 'a2' })];

    expect(filterApplications(applications, EMPTY_FILTERS, NOW)).toHaveLength(
      2,
    );
  });

  it('keeps only Applications without an owner in the unassigned view', () => {
    const applications = [
      application({ id: 'unowned', ownerId: null }),
      application({ id: 'owned', ownerId: 'staff-1' }),
    ];

    const result = filterApplications(
      applications,
      { ...EMPTY_FILTERS, view: 'unassigned' },
      NOW,
    );

    expect(result.map((entry) => entry.id)).toEqual(['unowned']);
  });

  it('treats an Application as stale on its seventh day, not before', () => {
    const applications = [
      application({ id: 'six-days', submittedAt: '2026-08-30T12:00:00.000Z' }),
      application({
        id: 'seven-days',
        submittedAt: '2026-08-29T12:00:00.000Z',
      }),
    ];

    const result = filterApplications(
      applications,
      { ...EMPTY_FILTERS, view: 'stale' },
      NOW,
    );

    expect(result.map((entry) => entry.id)).toEqual(['seven-days']);
  });

  it('searches the applicant name and the email address, ignoring case', () => {
    const applications = [
      application({ id: 'by-name', name: 'Jonas Krüger' }),
      application({ id: 'by-mail', email: 'ANNA@example.org' }),
      application({ id: 'neither', name: 'Lea Fischer' }),
    ];

    expect(
      filterApplications(
        applications,
        { ...EMPTY_FILTERS, search: 'krüger' },
        NOW,
      ).map((entry) => entry.id),
    ).toEqual(['by-name']);

    expect(
      filterApplications(
        applications,
        { ...EMPTY_FILTERS, search: 'anna@' },
        NOW,
      ).map((entry) => entry.id),
    ).toEqual(['by-mail']);
  });

  it('combines the view, the Category and the Status', () => {
    const applications = [
      application({
        id: 'match',
        ownerId: null,
        categoryId: 'legal',
        status: 'IN_REVIEW',
      }),
      application({
        id: 'wrong-category',
        ownerId: null,
        categoryId: 'social-media',
        status: 'IN_REVIEW',
      }),
      application({
        id: 'wrong-status',
        ownerId: null,
        categoryId: 'legal',
        status: 'NEW',
      }),
      application({
        id: 'has-owner',
        ownerId: 'staff-1',
        categoryId: 'legal',
        status: 'IN_REVIEW',
      }),
    ];

    const result = filterApplications(
      applications,
      {
        view: 'unassigned',
        search: '',
        categoryId: 'legal',
        status: 'IN_REVIEW',
      },
      NOW,
    );

    expect(result.map((entry) => entry.id)).toEqual(['match']);
  });

  it('leaves discarded Applications out of the list and its views', () => {
    const applications = [
      application({ id: 'working' }),
      application({ id: 'discarded', discardedAt: '2026-09-04T09:00:00.000Z' }),
    ];

    const result = filterApplications(
      applications,
      {
        view: 'all',
        search: '',
        categoryId: null,
        status: null,
      },
      NOW,
    );

    expect(result.map((entry) => entry.id)).toEqual(['working']);
  });
});
