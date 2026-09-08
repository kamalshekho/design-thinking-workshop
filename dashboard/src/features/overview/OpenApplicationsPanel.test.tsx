import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { de } from '@/content/de';
import { mockCategories, mockOwners } from '@/data/mockApplications';
import type { Application } from '@/domain/application';
import { setDiscarded } from '@/domain/application';

import { OpenApplicationsPanel } from './OpenApplicationsPanel';

const NOW = new Date('2026-09-05T12:00:00.000Z');

const RECEIVED = {
  oldest: '2026-08-01T09:00:00.000Z',
  middle: '2026-08-15T09:00:00.000Z',
  recent: '2026-08-28T09:00:00.000Z',
};

function application(overrides: Partial<Application> = {}): Application {
  return {
    id: 'a1',
    name: 'Mara Weber',
    email: 'mara.weber@example.org',
    submittedAt: RECEIVED.recent,
    categoryId: 'social-media',
    weeklyTime: 'HOURS_3_5',
    status: 'NEW',
    ownerId: null,
    about: 'Ich möchte mithelfen.',
    internalNotes: '',
    discardedAt: null,
    consentAt: RECEIVED.recent,
    consentTextVersion: '2026-09',
    ...overrides,
  };
}

/** Mirrors how `App` hands the shared Applications state down to both screens. */
function Host({ initial }: { initial: Application[] }) {
  const [applications, setApplications] = useState(initial);
  return (
    <OpenApplicationsPanel
      applications={applications}
      onApplicationsChange={setApplications}
      onDiscard={(ids) => {
        setApplications((current) =>
          setDiscarded(current, ids, NOW.toISOString()),
        );
      }}
      categories={mockCategories}
      owners={mockOwners}
      now={NOW}
    />
  );
}

describe('OpenApplicationsPanel', () => {
  it('shows the empty state when there are no open Applications', () => {
    render(<Host initial={[application({ id: 'done', status: 'ACTIVE' })]} />);

    expect(screen.getByText('Keine offenen Anfragen.')).toBeInTheDocument();
  });

  it('excludes completed Applications and counts the rest', async () => {
    const applications = [
      application({ id: 'new', status: 'NEW' }),
      application({ id: 'active', status: 'ACTIVE' }),
      application({ id: 'declined', status: 'DECLINED' }),
    ];

    render(<Host initial={applications} />);

    await waitFor(() =>
      expect(screen.getByText('1 von 1 offenen Anfragen')).toBeInTheDocument(),
    );
  });

  it('lists the oldest open Applications first', async () => {
    const applications = [
      application({ id: 'recent', submittedAt: RECEIVED.recent }),
      application({ id: 'oldest', submittedAt: RECEIVED.oldest }),
      application({ id: 'middle', submittedAt: RECEIVED.middle }),
    ];

    render(<Host initial={applications} />);

    await waitFor(() => {
      const rows = screen
        .getAllByRole('row')
        .filter((row) => row.getAttribute('data-key'));
      expect(rows.map((row) => row.getAttribute('data-key'))).toEqual([
        'oldest',
        'middle',
        'recent',
      ]);
    });
  });

  it('finds an Application by search that is outside the five-row cap', async () => {
    const user = userEvent.setup();
    const olderFive = Array.from({ length: 5 }, (_, index) =>
      application({
        id: `older-${String(index)}`,
        submittedAt: `2026-07-0${String(index + 1)}T09:00:00.000Z`,
      }),
    );
    const applications = [
      ...olderFive,
      application({
        id: 'searched-for',
        name: 'Jonas Krüger',
        submittedAt: RECEIVED.middle,
      }),
    ];

    render(<Host initial={applications} />);

    await waitFor(() =>
      expect(screen.getByText('5 von 6 offenen Anfragen')).toBeInTheDocument(),
    );

    await user.type(
      screen.getByPlaceholderText('Name oder E-Mail suchen'),
      'krüger',
    );

    await waitFor(() =>
      expect(screen.getByText('1 von 1 offenen Anfragen')).toBeInTheDocument(),
    );
    expect(screen.getByText('Jonas Krüger')).toBeInTheDocument();
  });

  it('shows the reset action only while a filter is active, and clears filters on click', async () => {
    const user = userEvent.setup();
    render(<Host initial={[application()]} />);

    expect(
      screen.queryByRole('button', { name: 'Filter zurücksetzen' }),
    ).not.toBeInTheDocument();

    await user.type(
      screen.getByPlaceholderText('Name oder E-Mail suchen'),
      'xyz',
    );

    await waitFor(() =>
      expect(screen.getByText('Keine passenden Anfragen.')).toBeInTheDocument(),
    );

    await user.click(
      screen.getByRole('button', { name: 'Filter zurücksetzen' }),
    );

    await waitFor(() =>
      expect(screen.getByText('1 von 1 offenen Anfragen')).toBeInTheDocument(),
    );
  });

  it('opens the drawer on row click and reflects an edit made through it', async () => {
    const user = userEvent.setup();
    render(<Host initial={[application({ id: 'a1', status: 'NEW' })]} />);

    await waitFor(() =>
      expect(screen.getByText('Mara Weber')).toBeInTheDocument(),
    );

    await user.click(screen.getByText('Mara Weber'));

    expect(
      screen.getByRole('complementary', { name: 'Anfrage' }),
    ).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Status'), 'In Prüfung');

    // The Application is still open ('in-review'), so it must not vanish and
    // the drawer must not close on a Status change.
    expect(
      screen.getByRole('complementary', { name: 'Anfrage' }),
    ).toBeInTheDocument();
  });

  it('removes an Application from the panel once it becomes active, without closing the drawer', async () => {
    const user = userEvent.setup();
    render(
      <Host
        initial={[
          application({ id: 'a1', name: 'Mara Weber', status: 'NEW' }),
          application({
            id: 'a2',
            name: 'Jonas Krüger',
            status: 'NEW',
          }),
        ]}
      />,
    );

    await waitFor(() =>
      expect(screen.getByText('Mara Weber')).toBeInTheDocument(),
    );

    await user.click(screen.getByText('Mara Weber'));
    await user.selectOptions(screen.getByLabelText('Status'), 'Aktiv');

    const grid = screen.getByRole('grid');
    await waitFor(() =>
      expect(within(grid).queryByText('Mara Weber')).not.toBeInTheDocument(),
    );
    expect(
      screen.getByRole('complementary', { name: 'Anfrage' }),
    ).toBeInTheDocument();
    expect(within(grid).getByText('Jonas Krüger')).toBeInTheDocument();
  });

  it('opens the drawer from the keyboard', async () => {
    render(<Host initial={[application({ id: 'a1' })]} />);

    const cell = await screen.findByRole('rowheader', { name: 'Mara Weber' });
    cell.focus();
    await userEvent.setup().keyboard('{Enter}');

    await waitFor(() =>
      expect(
        screen.getByRole('complementary', { name: 'Anfrage' }),
      ).toBeInTheDocument(),
    );
  });

  it('discards a single Application from the row action, like Anfragen does', async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(
      <Host
        initial={[
          application({ id: 'a1', name: 'Mara Weber' }),
          application({ id: 'a2', name: 'Jonas Krüger' }),
        ]}
      />,
    );

    const grid = await screen.findByRole('grid');
    const row = within(grid)
      .getAllByRole('row')
      .find((candidate) => candidate.getAttribute('data-key') === 'a1');
    await user.click(
      within(row as HTMLElement).getByRole('button', {
        name: de.applications.discardOne('Mara Weber'),
      }),
    );

    await waitFor(() =>
      expect(within(grid).queryByText('Mara Weber')).not.toBeInTheDocument(),
    );
    expect(within(grid).getByText('Jonas Krüger')).toBeInTheDocument();
    confirm.mockRestore();
  });

  it('discards the checked Applications from the bulk action, like Anfragen does', async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(
      <Host
        initial={[
          application({ id: 'a1', name: 'Mara Weber' }),
          application({ id: 'a2', name: 'Jonas Krüger' }),
        ]}
      />,
    );

    const grid = await screen.findByRole('grid');
    const row = within(grid)
      .getAllByRole('row')
      .find((candidate) => candidate.getAttribute('data-key') === 'a2');
    await user.click(within(row as HTMLElement).getByRole('checkbox'));

    const bulkDiscard = screen.getByRole('button', {
      name: de.applications.discardSelected(1),
    });
    expect(bulkDiscard).toBeEnabled();
    await user.click(bulkDiscard);

    await waitFor(() =>
      expect(within(grid).queryByText('Jonas Krüger')).not.toBeInTheDocument(),
    );
    expect(within(grid).getByText('Mara Weber')).toBeInTheDocument();
    confirm.mockRestore();
  });

  it('links to Anfragen preserving search, Category and owner, without the five-row cap', async () => {
    const user = userEvent.setup();
    render(<Host initial={[application({ id: 'a1' })]} />);

    await user.type(
      screen.getByPlaceholderText('Name oder E-Mail suchen'),
      'Mara',
    );
    await user.click(screen.getByLabelText('Kategorie'));
    await user.click(
      await screen.findByRole('option', { name: 'Social Media' }),
    );

    await user.click(screen.getByLabelText('Zuständigkeit'));
    await user.click(
      await screen.findByRole('option', { name: 'Nicht zugewiesen' }),
    );

    const link = screen.getByRole('link', {
      name: 'Alle offenen Anfragen ansehen',
    });

    const href = link.getAttribute('href') ?? '';
    const params = new URLSearchParams(href.split('?')[1]);

    expect(params.get('search')).toBe('Mara');
    expect(params.get('categoryId')).toBe('social-media');
    expect(params.get('ownerId')).toBe('unassigned');
    expect(params.get('excludeCompleted')).toBe('1');
  });
});
