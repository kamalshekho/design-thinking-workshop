import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { links } from '../content/links';
import { App } from './App';

afterEach(() => {
  vi.useRealTimers();
});

describe('App', () => {
  it('shows the applicant-facing copy in German only', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(
      screen.getByRole('heading', { name: 'ichbinhier lebt vom Mitmachen.' }),
    ).toBeVisible();

    expect(screen.queryByRole('button', { name: 'EN' })).toBeNull();

    expect(
      within(screen.getByRole('banner')).queryAllByRole('link'),
    ).toHaveLength(0);

    const footer = screen.getByRole('contentinfo');

    expect(within(footer).getByText('Postfach 25588')).toBeVisible();
    expect(within(footer).getByText('10129 Berlin')).toBeVisible();
    expect(within(footer).getByText('info@ichbinhier.online')).toBeVisible();

    expect(
      within(footer).getByRole('link', { name: 'Sprich mit uns' }),
    ).toHaveAttribute('href', '#');

    expect(
      within(footer).getByRole('link', { name: 'Impressum' }),
    ).toHaveAttribute('href', '#');

    expect(
      within(footer).getByRole('link', { name: 'Datenschutz' }),
    ).toHaveAttribute('href', links.privacyPolicy);

    expect(
      within(footer).getByRole('link', { name: 'Spende hier' }),
    ).toHaveAttribute('href', '#');

    const routeSelect = screen.getByLabelText('Wie möchtest du uns helfen?');
    await waitFor(() => expect(routeSelect).not.toBeDisabled());
    await user.selectOptions(routeSelect, 'Social Media');

    expect(screen.getByLabelText('Zeit pro Woche')).toBeVisible();

    expect(
      screen.getByRole('link', { name: 'Datenschutzerklärung' }),
    ).toHaveAttribute('href', links.privacyPolicy);
  });

  it('shows the current calendar year in the footer copyright', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2029-06-15T12:00:00Z'));

    render(<App />);

    expect(
      screen.getByText(
        'Copyright 2029 ichbinhier e.V. – Alle Rechte vorbehalten.',
      ),
    ).toBeVisible();
  });
});
