import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

import { de } from '@/content/de';
import {
  createMockApplications,
  mockCategories,
  mockOwners,
} from '@/data/mockApplications';
import type { Application } from '@/domain/application';
import { setDiscarded } from '@/domain/application';

import { ApplicationsScreen } from './ApplicationsScreen';
import type { NotesDraft } from './useNotesDraft';

const NOW = new Date('2026-09-05T12:00:00.000Z');

/**
 * Mirrors what `ApplicationsContainer` hands down, so a test exercises the
 * screen against the same wiring the application uses. The notes draft is held
 * here for the same reason it is held there: while one exists the field shows
 * it rather than the list's value.
 */
function Host() {
  const [applications, setApplications] = useState<Application[]>(() =>
    createMockApplications(NOW),
  );
  const [draft, setDraft] = useState<NotesDraft | null>(null);

  return (
    <ApplicationsScreen
      now={NOW}
      applications={applications}
      onEdit={(id, change) => {
        setApplications((current) =>
          current.map((application) =>
            application.id === id ? { ...application, ...change } : application,
          ),
        );
      }}
      onDiscard={(ids) => {
        setApplications((current) =>
          setDiscarded(current, ids, NOW.toISOString()),
        );
      }}
      categories={mockCategories}
      owners={mockOwners}
      notes={{
        draft,
        onChange: (applicationId, text) => {
          setDraft({ applicationId, text });
        },
      }}
    />
  );
}

describe('ApplicationsScreen', () => {
  it('counts the Applications behind each view', () => {
    render(<Host />);

    const names = screen
      .getAllByRole('tab')
      .map((tab) => tab.textContent.replace(/\s+/g, ' ').trim());

    expect(names).toEqual(['Alle8', 'Nicht zugewiesen3', 'Älter als 7 Tage4']);
  });

  it('narrows the list when a Status is chosen', async () => {
    const user = userEvent.setup();
    render(<Host />);

    expect(screen.getByText('8 von 8 Anfragen')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Filter' }));

    await user.selectOptions(
      screen.getByLabelText('Status'),
      screen.getByRole('option', { name: 'Neu' }),
    );

    await waitFor(() =>
      expect(screen.getByText('3 von 8 Anfragen')).toBeInTheDocument(),
    );
  });

  it('switches a named view while preserving the shared filter state', async () => {
    const user = userEvent.setup();
    render(<Host />);

    await user.click(screen.getByRole('tab', { name: /Nicht zugewiesen/ }));

    await waitFor(() =>
      expect(screen.getByText('3 von 8 Anfragen')).toBeInTheDocument(),
    );

    await user.click(screen.getByRole('button', { name: 'Filter' }));
    await user.selectOptions(
      screen.getByLabelText('Status'),
      screen.getByRole('option', { name: 'Neu' }),
    );

    await waitFor(() =>
      expect(screen.getByText('3 von 8 Anfragen')).toBeInTheDocument(),
    );
  });

  it('renders the grid rows into the DOM', async () => {
    render(<Host />);

    await waitFor(() =>
      expect(screen.getByText('Mara Weber')).toBeInTheDocument(),
    );
  });

  it('marks the open row and closes the drawer on Escape', async () => {
    const user = userEvent.setup();
    render(<Host />);

    const name = () => within(screen.getByRole('grid')).getByText('Mara Weber');
    const closeButton = () =>
      screen.queryByRole('button', { name: de.detail.close });

    await user.click(name());
    expect(closeButton()).toBeInTheDocument();
    expect(name().closest('tr')?.className).toContain('row-rail');

    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(closeButton()).not.toBeInTheDocument();
    });
    expect(name().closest('tr')?.className).not.toContain('row-rail');
  });

  it('closes the drawer when the open row is clicked again', async () => {
    const user = userEvent.setup();
    render(<Host />);

    const name = () => within(screen.getByRole('grid')).getByText('Mara Weber');
    const closeButton = () =>
      screen.queryByRole('button', { name: de.detail.close });

    await user.click(name());
    expect(closeButton()).toBeInTheDocument();

    await user.click(name());

    await waitFor(() => {
      expect(closeButton()).not.toBeInTheDocument();
    });
    expect(name().closest('tr')?.className).not.toContain('row-rail');
  });

  it('keeps the drawer open when a different row is clicked', async () => {
    const user = userEvent.setup();
    render(<Host />);

    const grid = () => within(screen.getByRole('grid'));
    const closeButton = () =>
      screen.queryByRole('button', { name: de.detail.close });

    await user.click(grid().getByText('Mara Weber'));
    await user.click(grid().getByText('Peter Schmitt'));

    expect(closeButton()).toBeInTheDocument();
    expect(
      grid().getByText('Peter Schmitt').closest('tr')?.className,
    ).toContain('row-rail');
    expect(
      grid().getByText('Mara Weber').closest('tr')?.className,
    ).not.toContain('row-rail');
  });

  it('flips a row between unread and read as an Owner is assigned and cleared', async () => {
    const user = userEvent.setup();
    render(<Host />);

    const [firstOwner] = mockOwners;
    expect(firstOwner).toBeDefined();

    // "Mara Weber" is the newest Application and has no Owner in the mock set.
    const name = () => within(screen.getByRole('grid')).getByText('Mara Weber');
    const row = () => name().closest('tr');

    expect(row()).toHaveClass('bg-bg-unread');
    expect(name()).toHaveClass('font-semibold');

    /** Zuständigkeit is a listbox, not a `select`: open it, then pick a row. */
    async function assignOwner(ownerName: string): Promise<void> {
      await user.click(
        screen.getByRole('button', {
          name: new RegExp(de.detail.owner),
        }),
      );
      await user.click(screen.getByRole('option', { name: ownerName }));
    }

    await user.click(name());
    await assignOwner(firstOwner?.name ?? '');

    await waitFor(() => expect(name()).not.toHaveClass('font-semibold'));
    expect(row()).not.toHaveClass('bg-bg-unread');

    await assignOwner(de.application.unassigned);

    await waitFor(() => expect(name()).toHaveClass('font-semibold'));
    expect(row()).toHaveClass('bg-bg-unread');
  });

  it('sorts the rendered rows when a sortable table heading is activated', async () => {
    const user = userEvent.setup();
    render(<Host />);

    const rowIds = () =>
      screen
        .getAllByRole('row')
        .map((row) => row.getAttribute('row-id'))
        .filter((id): id is string => id !== null);

    const newestFirst = rowIds();
    await user.click(screen.getByRole('columnheader', { name: 'Eingegangen' }));

    expect(rowIds()).toEqual(newestFirst.toReversed());
  });
});
