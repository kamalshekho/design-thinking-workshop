import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { App } from './App';

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
    expect(
      within(screen.getByRole('contentinfo')).queryAllByRole('link'),
    ).toHaveLength(0);
    expect(screen.getByText('kontakt@example.org')).toBeVisible();

    const routeSelect = screen.getByLabelText('Wie möchtest du uns helfen?');
    await waitFor(() => expect(routeSelect).not.toBeDisabled());
    await user.selectOptions(routeSelect, 'Social Media');

    expect(screen.getByLabelText('Zeit pro Woche')).toBeVisible();
  });
});
