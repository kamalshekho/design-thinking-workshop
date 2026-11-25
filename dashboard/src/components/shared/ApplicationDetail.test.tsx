import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import {
  createMockApplications,
  mockCategories,
  mockOwners,
} from '@/test/mockApplications';

import { ApplicationDrawer } from './ApplicationDrawer';
import { ApplicationPage } from './ApplicationPage';

const REFERENCE_DATE = new Date('2026-09-08T09:00:00Z');

describe('ApplicationDrawer onboarding', () => {
  it('shows onboarding progress and copy button only when onboarding is present and copies the link', async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, 'writeText');
    const apps = createMockApplications(REFERENCE_DATE);
    const baseApp = apps[0]!;

    const withoutOnboarding = { ...baseApp, onboarding: null };

    const { rerender } = render(
      <ApplicationDrawer
        application={withoutOnboarding}
        categories={mockCategories}
        owners={mockOwners}
        onClose={vi.fn()}
        onChange={vi.fn()}
        notesValue=""
        onNotesChange={vi.fn()}
      />,
    );

    expect(screen.queryByText(/Onboarding:/)).not.toBeInTheDocument();

    expect(
      screen.queryByRole('button', { name: 'Onboarding-Link kopieren' }),
    ).not.toBeInTheDocument();

    const withOnboarding = {
      ...baseApp,
      status: 'ACCEPTED' as const,
      onboarding: {
        link: 'http://localhost:8081/onboarding/test-token-123',
        doneSteps: 2,
        totalSteps: 4,
      },
    };

    rerender(
      <ApplicationDrawer
        application={withOnboarding}
        categories={mockCategories}
        owners={mockOwners}
        onClose={vi.fn()}
        onChange={vi.fn()}
        notesValue=""
        onNotesChange={vi.fn()}
      />,
    );

    expect(screen.getByText('Onboarding: 2 von 4 Schritten')).toBeVisible();

    const copyLinkButton = screen.getByRole('button', {
      name: 'Onboarding-Link kopieren',
    });

    expect(copyLinkButton).toBeVisible();

    await user.click(copyLinkButton);

    expect(writeText).toHaveBeenCalledWith(
      'http://localhost:8081/onboarding/test-token-123',
    );
  });

  it('lists Angenommen between Info-Runde gebucht and Aktiv', () => {
    const apps = createMockApplications(REFERENCE_DATE);

    render(
      <ApplicationDrawer
        application={apps[0]!}
        categories={mockCategories}
        owners={mockOwners}
        onClose={vi.fn()}
        onChange={vi.fn()}
        notesValue=""
        onNotesChange={vi.fn()}
      />,
    );

    const options = screen
      .getAllByRole('option')
      .map((option) => option.textContent);

    expect(options).toEqual([
      'Neu',
      'In Prüfung',
      'Info-Runde gebucht',
      'Angenommen',
      'Aktiv',
      'Warteliste',
      'Abgelehnt',
    ]);
  });
});

describe('ApplicationPage onboarding', () => {
  it('shows onboarding progress and copies link when onboarding is present', async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, 'writeText');
    const apps = createMockApplications(REFERENCE_DATE);

    const withOnboarding = {
      ...apps[0]!,
      status: 'ACCEPTED' as const,
      onboarding: {
        link: 'http://localhost:8081/onboarding/mobile-token',
        doneSteps: 3,
        totalSteps: 4,
      },
    };

    render(
      <ApplicationPage
        application={withOnboarding}
        categories={mockCategories}
        owners={mockOwners}
        onClose={vi.fn()}
        onChange={vi.fn()}
        notesValue=""
        onNotesChange={vi.fn()}
        staffMemberId="staff-1"
      />,
    );

    expect(screen.getByText('Onboarding: 3 von 4 Schritten')).toBeVisible();

    await user.click(
      screen.getByRole('button', { name: 'Onboarding-Link kopieren' }),
    );

    expect(writeText).toHaveBeenCalledWith(
      'http://localhost:8081/onboarding/mobile-token',
    );
  });
});
