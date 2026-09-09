import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { de } from '@/content/de';
import {
  createMockApplications,
  mockCategories,
  mockOwners,
} from '@/data/mockApplications';
import type { Application } from '@/domain/application';
import { setDiscarded } from '@/domain/application';

import { DiscardedApplicationsScreen } from './DiscardedApplicationsScreen';

const NOW = new Date('2026-09-05T12:00:00.000Z');

/** The first two of the mock set, as `App` hands them to this screen. */
function discardedApplications(): Application[] {
  const applications = createMockApplications(NOW).slice(0, 2);

  return setDiscarded(
    applications,
    new Set(applications.map((application) => application.id)),
    NOW.toISOString(),
  );
}

function renderScreen(applications: Application[] = discardedApplications()) {
  const onRestore = vi.fn<(ids: ReadonlySet<string>) => void>();
  const onErase = vi.fn<(ids: ReadonlySet<string>) => void>();

  render(
    <DiscardedApplicationsScreen
      applications={applications}
      onRestore={onRestore}
      onErase={onErase}
      categories={mockCategories}
      owners={mockOwners}
      now={NOW}
    />,
  );

  return { onRestore, onErase };
}

describe('DiscardedApplicationsScreen', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('explains the empty screen instead of showing an empty table', () => {
    renderScreen([]);

    expect(screen.getByText(de.discarded.empty)).toBeInTheDocument();
    expect(screen.getByText(de.discarded.emptyHint)).toBeInTheDocument();
  });

  it('restores one Application without asking', async () => {
    const user = userEvent.setup();
    const { onRestore } = renderScreen();

    await user.click(
      screen.getByRole('button', {
        name: de.discarded.restoreOne('Mara Weber'),
      }),
    );

    expect(onRestore).toHaveBeenCalledWith(new Set(['application-1']));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('asks before erasing one Application, and does nothing on cancel', async () => {
    const user = userEvent.setup();
    const { onErase } = renderScreen();

    await user.click(
      screen.getByRole('button', { name: de.discarded.eraseOne('Mara Weber') }),
    );

    const dialog = screen.getByRole('alertdialog', {
      name: de.discarded.confirmEraseOne('Mara Weber'),
    });
    expect(
      within(dialog).getByText(de.discarded.eraseWarning),
    ).toBeInTheDocument();

    await user.click(
      within(dialog).getByRole('button', { name: de.confirm.cancel }),
    );

    expect(onErase).not.toHaveBeenCalled();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('erases one Application once the dialog is confirmed', async () => {
    const user = userEvent.setup();
    const { onErase } = renderScreen();

    await user.click(
      screen.getByRole('button', { name: de.discarded.eraseOne('Mara Weber') }),
    );
    await user.click(
      within(screen.getByRole('alertdialog')).getByRole('button', {
        name: de.discarded.erase,
      }),
    );

    expect(onErase).toHaveBeenCalledWith(new Set(['application-1']));
  });

  it('keeps both bulk buttons on the bar, disabled until a row is checked', async () => {
    const user = userEvent.setup();
    const { onErase } = renderScreen();

    expect(
      screen.getByRole('button', { name: de.discarded.restore }),
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: de.discarded.erase }),
    ).toBeDisabled();

    // [0] is the header checkbox, [1] the first row's.
    const rowCheckbox = screen.getAllByRole('checkbox')[1];
    await user.click(rowCheckbox as HTMLElement);

    expect(
      screen.getByRole('button', { name: de.discarded.restoreSelected(1) }),
    ).toBeEnabled();
    await user.click(
      screen.getByRole('button', { name: de.discarded.eraseSelected(1) }),
    );
    await user.click(
      within(
        screen.getByRole('alertdialog', {
          name: de.discarded.confirmEraseSelected(1),
        }),
      ).getByRole('button', { name: de.discarded.erase }),
    );

    expect(onErase).toHaveBeenCalledWith(new Set(['application-1']));
  });

  it('says so when the search matches no discarded Application', async () => {
    const user = userEvent.setup();
    renderScreen();

    await user.type(screen.getByRole('searchbox'), 'niemand');

    expect(screen.getByText(de.discarded.noMatches)).toBeInTheDocument();
    expect(screen.getByText(de.discarded.count(0, 2))).toBeInTheDocument();
  });

  it('does not mark an Application without an Owner as unread', () => {
    renderScreen();

    const row = screen
      .getAllByRole('row')
      .find(
        (candidate) => candidate.getAttribute('data-key') === 'application-1',
      );

    expect(row).not.toHaveClass('bg-bg-unread');
    expect(screen.getByText('Mara Weber')).not.toHaveClass('font-semibold');
  });
});
