import { describe, expect, it } from 'vitest';

import type { Application } from '@/domain/application';

import {
  EMPTY_OPEN_APPLICATIONS_FILTERS,
  selectOpenApplications,
} from './selectOpenApplications';

function application(overrides: Partial<Application> = {}): Application {
  return {
    id: 'a1',
    applicantName: 'Mara Weber',
    email: 'mara.weber@example.org',
    receivedAt: '2026-09-04T09:00:00.000Z',
    categoryId: 'social-media',
    weeklyAvailability: 4,
    status: 'new',
    ownerId: null,
    message: 'Ich möchte mithelfen.',
    internalNotes: '',
    discardedAt: null,
    consent: {
      givenAt: '2026-09-04T09:00:00.000Z',
      privacyPolicyVersion: '2026-05',
    },
    ...overrides,
  };
}

describe('selectOpenApplications', () => {
  it('excludes active and declined Applications', () => {
    const applications = [
      application({ id: 'new', status: 'new' }),
      application({ id: 'in-review', status: 'in-review' }),
      application({ id: 'active', status: 'active' }),
      application({ id: 'declined', status: 'declined' }),
    ];

    expect(
      selectOpenApplications(applications, EMPTY_OPEN_APPLICATIONS_FILTERS).map(
        (entry) => entry.id,
      ),
    ).toEqual(['new', 'in-review']);
  });

  it('sorts the oldest Application first', () => {
    const applications = [
      application({
        id: 'newest',
        receivedAt: '2026-09-04T09:00:00.000Z',
      }),
      application({
        id: 'oldest',
        receivedAt: '2026-08-20T09:00:00.000Z',
      }),
      application({
        id: 'middle',
        receivedAt: '2026-08-30T09:00:00.000Z',
      }),
    ];

    expect(
      selectOpenApplications(applications, EMPTY_OPEN_APPLICATIONS_FILTERS).map(
        (entry) => entry.id,
      ),
    ).toEqual(['oldest', 'middle', 'newest']);
  });

  it('finds an Application by search that a five-row cap would otherwise hide', () => {
    const olderFive = Array.from({ length: 5 }, (_, index) =>
      application({
        id: `older-${String(index)}`,
        receivedAt: `2026-08-0${String(index + 1)}T09:00:00.000Z`,
      }),
    );
    const applications = [
      ...olderFive,
      application({
        id: 'searched-for',
        applicantName: 'Jonas Krüger',
        receivedAt: '2026-08-20T09:00:00.000Z',
      }),
    ];

    const result = selectOpenApplications(applications, {
      ...EMPTY_OPEN_APPLICATIONS_FILTERS,
      search: 'krüger',
    });

    expect(result.map((entry) => entry.id)).toEqual(['searched-for']);
  });

  it('combines search, Category and owner with AND', () => {
    const applications = [
      application({
        id: 'match',
        applicantName: 'Jonas Krüger',
        categoryId: 'legal',
        ownerId: 'staff-1',
      }),
      application({
        id: 'wrong-category',
        applicantName: 'Jonas Krüger',
        categoryId: 'social-media',
        ownerId: 'staff-1',
      }),
      application({
        id: 'wrong-owner',
        applicantName: 'Jonas Krüger',
        categoryId: 'legal',
        ownerId: 'staff-2',
      }),
    ];

    const result = selectOpenApplications(applications, {
      search: 'krüger',
      categoryId: 'legal',
      ownerId: 'staff-1',
    });

    expect(result.map((entry) => entry.id)).toEqual(['match']);
  });

  it('matches the unassigned sentinel to an Application with no owner', () => {
    const applications = [
      application({ id: 'unowned', ownerId: null }),
      application({ id: 'owned', ownerId: 'staff-1' }),
    ];

    const result = selectOpenApplications(applications, {
      ...EMPTY_OPEN_APPLICATIONS_FILTERS,
      ownerId: 'unassigned',
    });

    expect(result.map((entry) => entry.id)).toEqual(['unowned']);
  });

  it('leaves discarded Applications out of the panel', () => {
    const applications = [
      application({ id: 'working' }),
      application({ id: 'discarded', discardedAt: '2026-09-04T09:00:00.000Z' }),
    ];

    const result = selectOpenApplications(
      applications,
      EMPTY_OPEN_APPLICATIONS_FILTERS,
    );

    expect(result.map((entry) => entry.id)).toEqual(['working']);
  });
});
