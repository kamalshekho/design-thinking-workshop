import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { de } from '@/content/de';
import type { Application } from '@/domain/application';
import { mockCategories, mockOwners } from '@/test/mockApplications';
import { setViewportWidth } from '@/test/viewport';

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
      selectedIds={new Set()}
      onSelectedIdsChange={() => undefined}
      rowActions={[
        {
          id: 'discard',
          icon: () => null,
          label: (row) => `${row.name} aussortieren`,
          onAction: () => undefined,
        },
      ]}
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

  describe('columns by width (issue #109)', () => {
    function headers(): string[] {
      return screen
        .getAllByRole('columnheader')
        .map((header) => header.textContent.trim())
        .filter((text) => text !== '');
    }

    it('shows every column at the desk except E-Mail and Verfügbarkeit', () => {
      renderTable([application()]);

      expect(headers()).toEqual([
        de.columns.name,
        de.columns.category,
        de.columns.status,
        de.columns.submittedAt,
        de.columns.owner,
        de.columns.actions,
      ]);
      expect(screen.getAllByRole('checkbox').length).toBeGreaterThan(0);
    });

    it('moves Kategorie and Zuständig under the name between 768 and 1279 px', () => {
      setViewportWidth(1024);
      const rowFor = renderTable([
        application({ id: 'owned', ownerId: 'staff-2' }),
      ]);

      expect(headers()).toEqual([
        de.columns.name,
        de.columns.status,
        de.columns.submittedAt,
        de.columns.actions,
      ]);
      expect(rowFor('owned')).toHaveTextContent(
        'Social Media · Samuel Adeyemi',
      );
    });

    it('keeps only the name below 640 px, with Status and age under it and no checkbox', () => {
      setViewportWidth(360);
      const rowFor = renderTable([application({ id: 'phone' })]);

      expect(headers()).toEqual([de.columns.name]);
      expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
      const row = rowFor('phone');
      expect(row).toBeDefined();
      expect(
        within(row as HTMLElement).getByText(
          `${de.statuses.NEW} · ${de.application.daysAgo(4)}`,
        ),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Mara Weber aussortieren' }),
      ).not.toBeInTheDocument();
    });
  });

  it('toggles row selection via click and keyboard on the selection checkbox', async () => {
    const user = userEvent.setup();
    const onSelectedIdsChange = vi.fn();

    render(
      <ApplicationTable
        applications={[
          application({ id: 'a1' }),
          application({ id: 'a2', name: 'Tom Klein' }),
        ]}
        categories={mockCategories}
        owners={mockOwners}
        now={NOW}
        onSelect={() => undefined}
        selectedIds={new Set()}
        onSelectedIdsChange={onSelectedIdsChange}
        rowActions={[
          {
            id: 'discard',
            icon: () => null,
            label: (row) => `${row.name} aussortieren`,
            onAction: () => undefined,
          },
        ]}
        ariaLabel="Anfragen"
      />,
    );

    const rowFor = (id: string) =>
      screen
        .getAllByRole('row')
        .find((row) => row.getAttribute('data-key') === id);
    const firstRow = rowFor('a1');
    const secondRow = rowFor('a2');
    expect(firstRow).toBeDefined();
    expect(secondRow).toBeDefined();

    await user.click(within(firstRow as HTMLElement).getByRole('checkbox'));
    expect(onSelectedIdsChange).toHaveBeenNthCalledWith(1, new Set(['a1']));

    const secondCheckbox = within(secondRow as HTMLElement).getByRole(
      'checkbox',
    );
    secondCheckbox.focus();
    await user.keyboard(' ');
    expect(onSelectedIdsChange).toHaveBeenNthCalledWith(2, new Set(['a2']));
  });
});
