import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { mockCategories, mockOwners } from '@/data/mockApplications';
import type { Application } from '@/domain/application';

import { ApplicationTable } from './application-table';

const NOW = new Date('2026-09-05T12:00:00.000Z');

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

function renderTable(applications: Application[]) {
  render(
    <ApplicationTable
      applications={applications}
      categories={mockCategories}
      owners={mockOwners}
      now={NOW}
      onSelect={() => undefined}
      ariaLabel="Anfragen"
    />,
  );

  return (id: string) =>
    screen
      .getAllByRole('row')
      .find((row) => row.getAttribute('data-key') === id);
}

describe('ApplicationTable', () => {
  it('marks an Application without an Owner as unread', () => {
    const rowFor = renderTable([application({ id: 'unowned', ownerId: null })]);
    const row = rowFor('unowned');

    expect(row).toHaveClass('bg-bg-unread');
    expect(screen.getByText('Mara Weber')).toHaveClass('font-semibold');
    expect(row?.querySelector('.bg-fuut-purple')).toBeInTheDocument();
  });

  it('leaves an Application with an Owner in its read state', () => {
    const rowFor = renderTable([
      application({ id: 'owned', ownerId: 'staff-1' }),
    ]);
    const row = rowFor('owned');

    expect(row).not.toHaveClass('bg-bg-unread');
    expect(screen.getByText('Mara Weber')).not.toHaveClass('font-semibold');
    expect(row?.querySelector('.bg-fuut-purple')).toBeNull();
  });

  /**
   * There is no photo anywhere: `GET /api/v1/staff/members` carries none
   * (`API.md`), so the Zuständigkeit column has one rendering rather than two.
   */
  it('shows an Owner as initials, with no image in the row', () => {
    const rowFor = renderTable([
      application({ id: 'owned', ownerId: 'staff-2' }),
    ]);
    const row = rowFor('owned');

    expect(row?.querySelector('img[data-avatar-img]')).toBeNull();
    expect(row).toHaveTextContent('SA');
  });
});
