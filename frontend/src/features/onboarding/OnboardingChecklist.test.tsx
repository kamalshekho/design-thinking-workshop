import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import {
  DEMO_ONBOARDING_TOKEN,
  INVALID_ONBOARDING_TOKEN,
} from '../../mocks/handlers';
import { server } from '../../mocks/server';
import { expectNoA11yViolations } from '../../test/a11y';
import { OnboardingChecklist } from './OnboardingChecklist';

describe('OnboardingChecklist', () => {
  it('shows a loading state while fetching onboarding data', () => {
    server.use(
      http.get('*/api/onboarding/:token', async () => {
        await delay('infinite');

        return HttpResponse.json({ name: 'Mara', steps: [] });
      }),
    );

    render(<OnboardingChecklist token={DEMO_ONBOARDING_TOKEN} />);

    expect(screen.getByRole('status')).toHaveTextContent(/geladen/i);
  });

  it('renders the rules, four checkboxes, external links, and updates progress on toggle', async () => {
    const user = userEvent.setup();

    const { container } = render(
      <OnboardingChecklist token={DEMO_ONBOARDING_TOKEN} />,
    );

    expect(
      await screen.findByRole('heading', { name: /Willkommen, Tobias/i }),
    ).toBeVisible();

    expect(
      screen.getByText(/Wir bleiben sachlich und respektvoll/),
    ).toBeVisible();

    expect(screen.getByText('2 von 4 erledigt')).toBeVisible();

    const labCheckbox = screen.getByLabelText(
      /Level 1 im Digital Democracy Lab machen/i,
    );

    expect(labCheckbox).not.toBeChecked();

    await user.click(labCheckbox);

    await waitFor(() => expect(labCheckbox).toBeChecked());
    expect(screen.getByText('3 von 4 erledigt')).toBeVisible();

    const facebookLink = screen.getByRole('link', {
      name: /Facebook-Gruppe/i,
    });

    expect(facebookLink).toHaveAttribute(
      'href',
      'https://www.facebook.com/groups/718574178311688',
    );

    expect(facebookLink).toHaveAttribute('target', '_blank');
    expect(facebookLink).toHaveAttribute('rel', 'noopener noreferrer');

    await expectNoA11yViolations(container);
  });

  it('shows the invalid link message when the server responds with 404', async () => {
    const { container } = render(
      <OnboardingChecklist token={INVALID_ONBOARDING_TOKEN} />,
    );

    expect(
      await screen.findByText(
        'Dieser Link ist nicht mehr gültig. Schreib uns an info@ichbinhier.online.',
      ),
    ).toBeVisible();

    await expectNoA11yViolations(container);
  });

  it('reverts the checkbox and shows an alert when saving a step fails', async () => {
    server.use(
      http.get('*/api/onboarding/:token', () =>
        HttpResponse.json({
          name: 'Tobias Hoffmann',
          steps: [
            { id: 'RULES', done: true },
            { id: 'COMMUNITY_GROUP', done: true },
            { id: 'DIGITAL_DEMOCRACY_LAB', done: false },
            { id: 'CONTACT', done: false },
          ],
        }),
      ),
      http.put('*/api/onboarding/:token/steps/:stepId', () =>
        HttpResponse.json(
          { status: 500, code: 'INTERNAL_ERROR' },
          {
            status: 500,
            headers: { 'Content-Type': 'application/problem+json' },
          },
        ),
      ),
    );

    const user = userEvent.setup();
    render(<OnboardingChecklist token={DEMO_ONBOARDING_TOKEN} />);

    const labCheckbox = await screen.findByLabelText(
      /Level 1 im Digital Democracy Lab machen/i,
    );

    expect(labCheckbox).not.toBeChecked();

    await user.click(labCheckbox);

    expect(await screen.findByRole('alert')).toBeVisible();
    expect(labCheckbox).not.toBeChecked();
    expect(screen.getByText('2 von 4 erledigt')).toBeVisible();
  });

  it('reverts only the failed step during concurrent toggles', async () => {
    server.use(
      http.get('*/api/onboarding/:token', () =>
        HttpResponse.json({
          name: 'Tobias Hoffmann',
          steps: [
            { id: 'RULES', done: true },
            { id: 'COMMUNITY_GROUP', done: true },
            { id: 'DIGITAL_DEMOCRACY_LAB', done: false },
            { id: 'CONTACT', done: false },
          ],
        }),
      ),
      http.put('*/api/onboarding/:token/steps/:stepId', async ({ params }) => {
        if (params.stepId === 'DIGITAL_DEMOCRACY_LAB') {
          await delay(30);

          return HttpResponse.json({
            name: 'Tobias Hoffmann',
            steps: [
              { id: 'RULES', done: true },
              { id: 'COMMUNITY_GROUP', done: true },
              { id: 'DIGITAL_DEMOCRACY_LAB', done: true },
              { id: 'CONTACT', done: false },
            ],
          });
        }

        await delay(60);

        return HttpResponse.json(
          { status: 500, code: 'INTERNAL_ERROR' },
          {
            status: 500,
            headers: { 'Content-Type': 'application/problem+json' },
          },
        );
      }),
    );

    const user = userEvent.setup();
    render(<OnboardingChecklist token={DEMO_ONBOARDING_TOKEN} />);

    const labCheckbox = await screen.findByLabelText(
      /Level 1 im Digital Democracy Lab machen/i,
    );

    const contactCheckbox = screen.getByLabelText(/Kontakt speichern/i);

    await user.click(labCheckbox);
    await user.click(contactCheckbox);

    expect(await screen.findByRole('alert')).toBeVisible();
    await waitFor(() => expect(labCheckbox).toBeChecked());
    expect(contactCheckbox).not.toBeChecked();
    expect(screen.getByText('3 von 4 erledigt')).toBeVisible();
  });

  it('shows a load error alert when fetching the checklist fails with 500', async () => {
    server.use(
      http.get(
        '*/api/onboarding/:token',
        () => new HttpResponse(null, { status: 500 }),
      ),
    );

    render(<OnboardingChecklist token={DEMO_ONBOARDING_TOKEN} />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /nicht geladen werden/i,
    );
  });
});
