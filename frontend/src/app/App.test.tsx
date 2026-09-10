import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { LocaleProvider } from '../content/LocaleProvider';
import { App } from './App';

describe('App', () => {
  it('switches all fixed applicant-facing copy to English', async () => {
    const user = userEvent.setup();
    render(
      <LocaleProvider>
        <App />
      </LocaleProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'EN' }));

    expect(
      await screen.findByRole('heading', {
        name: 'ichbinhier thrives on participation.',
      }),
    ).toBeVisible();
    expect(screen.getByRole('link', { name: 'About us' })).toBeVisible();
    expect(screen.getByText('Contact')).toBeVisible();
    expect(document.documentElement.lang).toBe('en');

    const routeSelect = screen.getByLabelText('How would you like to help?');
    await waitFor(() => expect(routeSelect).not.toBeDisabled());
    await user.selectOptions(routeSelect, 'Social Media');

    expect(screen.getByLabelText('Time per week')).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Send application' }),
    ).toBeVisible();
  });
});
