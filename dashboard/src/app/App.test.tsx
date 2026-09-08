import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { de } from '@/content/de';
import { currentStaffMember } from '@/data/currentStaffMember';

import { App } from './App';

/**
 * Every test below is about a dashboard screen, so it starts past the sign-in
 * gate (`A16`) rather than filling the form first. The gate itself is tested
 * in `features/auth/LoginScreen.test.tsx`, and once here in `signs out`.
 */
function renderSignedIn() {
  return render(<App signedInAs={currentStaffMember} />);
}

describe('App', () => {
  afterEach(() => {
    window.location.hash = '';
    vi.restoreAllMocks();
  });

  it('opens the sign-in screen with no Staff member signed in', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { name: de.auth.title }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('navigation', { name: de.navigation.label }),
    ).not.toBeInTheDocument();
  });

  it('signs out from the account menu, back to the sign-in screen', async () => {
    const user = userEvent.setup();

    renderSignedIn();

    await user.click(screen.getByRole('button', { name: de.account.menu }));
    await user.click(
      screen.getByRole('menuitem', { name: de.account.signOut }),
    );

    expect(
      screen.getByRole('heading', { name: de.auth.title }),
    ).toBeInTheDocument();
  });

  it('opens on the Applications screen', () => {
    renderSignedIn();

    expect(
      screen.getByRole('navigation', { name: de.navigation.label }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(de.overview.welcome(currentStaffMember.name)),
    ).not.toBeInTheDocument();
  });

  it('shows the four screens in the sidebar, Anfragen current', () => {
    renderSignedIn();

    const sidebar = screen.getByRole('navigation', {
      name: de.navigation.label,
    });

    expect(
      within(sidebar)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual([
      de.navigation.overview,
      de.navigation.applications,
      de.navigation.categories,
      // The fourth screen is last, in the sidebar's footer slot rather than
      // among the three the work happens on (`A16`).
      de.navigation.discarded,
    ]);

    expect(
      within(sidebar).getByRole('link', { name: de.navigation.applications }),
    ).toHaveAttribute('aria-current', 'page');
  });

  it('opens the account menu from the profile card', async () => {
    const user = userEvent.setup();

    renderSignedIn();

    await user.click(screen.getByRole('button', { name: de.account.menu }));

    expect(
      screen.getByRole('menuitem', { name: de.account.signOut }),
    ).toBeInTheDocument();
  });

  it('collapses the desktop sidebar to its icon navigation', async () => {
    const user = userEvent.setup();

    renderSignedIn();

    await user.click(
      screen.getByRole('button', { name: de.navigation.collapse }),
    );

    const toggle = screen.getByRole('button', { name: de.navigation.expand });

    expect(toggle).toBeInTheDocument();
    expect(toggle.closest('nav')).toBeInTheDocument();
    expect(toggle).toHaveClass('peer/toggle');
    expect(toggle).toHaveClass('lg:left-1/2', '-translate-x-1/2');
    expect(
      screen.getByRole('navigation', { name: de.navigation.label }),
    ).toHaveClass('lg:transition-[width]', 'duration-200');
    expect(
      screen.getByRole('link', { name: de.navigation.applications }),
    ).not.toHaveClass('lg:justify-center');
    expect(
      screen.getByRole('link', { name: de.navigation.applications }).lastChild,
    ).toHaveClass('lg:max-w-0', 'lg:[clip-path:inset(0_100%_0_0)]');
    expect(toggle).not.toHaveClass('bg-primary');
    expect(toggle).toHaveClass('hover:bg-primary_hover');
    expect(toggle.querySelector('svg')).toHaveClass(
      'lg:group-hover:opacity-100',
    );
    const compactWordmarks = Array.from(
      document.querySelectorAll('img[src="/Rectangle.png"]'),
    );
    const sidebarCompactWordmark = compactWordmarks.find((wordmark) =>
      wordmark.classList.contains('lg:opacity-100'),
    );

    expect(sidebarCompactWordmark).toHaveClass('opacity-0', 'lg:opacity-100');
    expect(
      sidebarCompactWordmark?.parentElement?.parentElement,
    ).not.toHaveClass('lg:opacity-0');
    expect(sidebarCompactWordmark?.parentElement?.parentElement).toHaveClass(
      'lg:left-1/2',
      'lg:-translate-x-1/2',
      'lg:peer-hover/toggle:opacity-0',
    );
    expect(screen.getByRole('button', { name: de.account.menu })).toHaveClass(
      'rounded-full',
    );
  });

  it('switches the active sidebar link and shows the welcome headline', async () => {
    const user = userEvent.setup();

    renderSignedIn();

    await user.click(
      screen.getByRole('link', { name: de.navigation.overview }),
    );

    expect(
      screen.getByRole('link', { name: de.navigation.overview }),
    ).toHaveAttribute('aria-current', 'page');
    expect(
      screen.getByText(de.overview.welcome(currentStaffMember.name)),
    ).toBeInTheDocument();
  });

  it('carries a Category renamed on Kategorien over to Anfragen', async () => {
    const user = userEvent.setup();
    renderSignedIn();

    await user.click(
      screen.getByRole('link', { name: de.navigation.categories }),
    );

    await user.click(
      screen.getByRole('button', {
        name: de.categories.editOne('Rechtliche Unterstützung'),
      }),
    );

    const field = screen.getByRole('textbox', { name: /^Name/ });
    await user.clear(field);
    await user.type(field, 'Rechtsberatung');
    await user.click(
      screen.getByRole('button', { name: de.categories.dialog.save }),
    );

    await user.click(
      screen.getByRole('link', { name: de.navigation.applications }),
    );

    await waitFor(() => {
      expect(screen.getAllByText('Rechtsberatung').length).toBeGreaterThan(0);
    });
  });

  it('discards an Application to the fourth screen and restores it', async () => {
    const user = userEvent.setup();
    renderSignedIn();

    await user.click(
      screen.getByRole('button', {
        name: de.applications.discardOne('Mara Weber'),
      }),
    );

    expect(screen.queryByText('Mara Weber')).not.toBeInTheDocument();

    await user.click(
      screen.getByRole('link', { name: de.navigation.discarded }),
    );

    expect(screen.getByText('Mara Weber')).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', {
        name: de.discarded.restoreOne('Mara Weber'),
      }),
    );

    expect(screen.getByText(de.discarded.empty)).toBeInTheDocument();

    await user.click(
      screen.getByRole('link', { name: de.navigation.applications }),
    );

    expect(screen.getByText('Mara Weber')).toBeInTheDocument();
  });

  it('erases a discarded Application, with no way back to Anfragen', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderSignedIn();

    await user.click(
      screen.getByRole('button', {
        name: de.applications.discardOne('Mara Weber'),
      }),
    );
    await user.click(
      screen.getByRole('link', { name: de.navigation.discarded }),
    );
    await user.click(
      screen.getByRole('button', {
        name: de.discarded.eraseOne('Mara Weber'),
      }),
    );

    expect(screen.getByText(de.discarded.empty)).toBeInTheDocument();

    await user.click(
      screen.getByRole('link', { name: de.navigation.applications }),
    );

    expect(screen.queryByText('Mara Weber')).not.toBeInTheDocument();
  });

  it('shares an edit on an Application between Übersicht and Anfragen', async () => {
    const user = userEvent.setup();
    renderSignedIn();

    await user.click(
      screen.getByRole('link', { name: de.navigation.overview }),
    );

    // "Jonas Krüger" is one of the five oldest open Applications, unlike
    // "Mara Weber" (arrived today), which the panel's five-row cap excludes.
    const overviewPanel = screen.getByRole('region', {
      name: de.overview.openApplications.title,
    });
    await waitFor(() =>
      expect(
        within(overviewPanel).getByText('Jonas Krüger'),
      ).toBeInTheDocument(),
    );
    await user.click(within(overviewPanel).getByText('Jonas Krüger'));
    await user.selectOptions(screen.getByLabelText('Status'), 'In Prüfung');
    await user.click(screen.getByRole('button', { name: de.detail.close }));

    await user.click(
      screen.getByRole('link', { name: de.navigation.applications }),
    );

    await user.click(screen.getByRole('button', { name: de.filters.filter }));

    await user.selectOptions(
      screen.getByLabelText(de.filters.status),
      screen.getByRole('option', { name: de.statuses.IN_REVIEW }),
    );

    await waitFor(() =>
      expect(screen.getByText('Jonas Krüger')).toBeInTheDocument(),
    );
  });
});
