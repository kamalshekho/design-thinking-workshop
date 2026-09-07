import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { mockCategories, mockOwners } from '@/data/mockApplications';
import type { Application } from '@/domain/application';

import { ApplicationTable } from './application-table';

const NOW = new Date('2026-09-05T12:00:00.000Z');

function application(overrides: Partial<Application> = {}): Application {
  return {
    id: 'a1',
    applicantName: 'Mara Weber',
    email: 'mara.weber@example.org',
    receivedAt: '2026-09-01T09:00:00.000Z',
    categoryId: 'social-media',
    weeklyAvailability: 4,
    status: 'new',
    ownerId: null,
    message: 'Ich möchte mithelfen.',
    internalNotes: '',
    discardedAt: null,
    consent: {
      givenAt: '2026-09-01T09:00:00.000Z',
      privacyPolicyVersion: '2026-05',
    },
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

  it('shows the photo of an Owner who has one', () => {
    const rowFor = renderTable([
      application({ id: 'owned', ownerId: 'staff-1' }),
    ]);

    // The applicant column carries initials only, so the row's single image is
    // the Owner's photo.
    const photo = rowFor('owned')?.querySelector('img[data-avatar-img]');

    expect(photo).toHaveAttribute('src', mockOwners[0]?.avatar);
    // Decorative: the Owner's name sits next to it.
    expect(photo).toHaveAttribute('alt', '');
  });

  it('falls back to initials for an Owner without a photo', () => {
    const rowFor = renderTable([
      application({ id: 'owned', ownerId: 'staff-2' }),
    ]);
    const row = rowFor('owned');

    expect(row?.querySelector('img[data-avatar-img]')).toBeNull();
    expect(row).toHaveTextContent('SA');
  });
});
