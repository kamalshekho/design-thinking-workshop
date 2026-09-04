import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import { StrictMode } from 'react';
import { describe, expect, it } from 'vitest';

import { MOCK_CATEGORIES, validationProblem } from '../../mocks/handlers';
import { server } from '../../mocks/server';
import { expectNoA11yViolations } from '../../test/a11y';
import { ApplicationForm } from './ApplicationForm';

async function pickRoute(label: string) {
  const user = userEvent.setup();
  render(<ApplicationForm />);
  const select = screen.getByLabelText('Wie möchtest du uns helfen?');
  await waitFor(() => expect(select).not.toBeDisabled());
  await user.selectOptions(select, label);
  return user;
}

async function fillValidApplication(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Name'), 'Anna Müller');
  await user.type(screen.getByLabelText('E-Mail'), 'anna@example.de');
  await user.selectOptions(
    screen.getByLabelText('Zeit pro Woche'),
    '1–2 Stunden',
  );
  await user.click(
    screen.getByRole('checkbox', {
      name: /Ich bin damit einverstanden/,
    }),
  );
}

describe('ApplicationForm', () => {
  it('shows only the route selector, in the specified order', async () => {
    render(<ApplicationForm />);

    expect(screen.getByText('ichbinhier lebt vom Mitmachen.')).toBeVisible();

    const select = screen.getByLabelText('Wie möchtest du uns helfen?');
    await waitFor(() => expect(select).not.toBeDisabled());

    const optionValues = Array.from(select.querySelectorAll('option'))
      .filter((option) => option.value !== '')
      .map((option) => option.value);
    expect(optionValues).toEqual([
      'COMMUNITY',
      ...MOCK_CATEGORIES.map((category) => category.id),
      'SUPPORTING_MEMBER',
    ]);

    expect(
      screen.queryByLabelText('Name'),
      // fields 2–6 only appear once a Vereinsarbeit route is picked
    ).not.toBeInTheDocument();
  });

  it('has no detectable accessibility violations', async () => {
    const { container } = render(<ApplicationForm />);

    await waitFor(() =>
      expect(
        screen.getByLabelText('Wie möchtest du uns helfen?'),
      ).not.toBeDisabled(),
    );
    await expectNoA11yViolations(container);
  });

  it('shows the direct-route panel for Aktionsgruppe, not the application fields', async () => {
    await pickRoute('Bei #ichbinhier mitmachen (Aktionsgruppe)');

    expect(screen.getByText('Du bist sofort dabei.')).toBeVisible();
    expect(screen.queryByLabelText('Name')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Bewerbung abschicken' }),
    ).not.toBeInTheDocument();
  });

  it('shows the direct-route panel for Fördermitglied, not the application fields', async () => {
    await pickRoute('Fördermitglied werden');

    expect(screen.getByText('Du unterstützt uns direkt.')).toBeVisible();
    expect(screen.queryByLabelText('Name')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Bewerbung abschicken' }),
    ).not.toBeInTheDocument();
  });

  it('opens fields 2–6 for a Vereinsarbeit route', async () => {
    await pickRoute('Social Media');

    expect(screen.getByLabelText('Name')).toBeVisible();
    expect(screen.getByLabelText('E-Mail')).toBeVisible();
    expect(screen.getByLabelText('Zeit pro Woche')).toBeVisible();
    expect(screen.getByLabelText('Erzähl uns kurz von dir')).toBeVisible();
    expect(
      screen.getByRole('checkbox', { name: /Ich bin damit einverstanden/ }),
    ).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Bewerbung abschicken' }),
    ).toBeVisible();
  });

  it('shows an inline error under the email field for an unreachable address', async () => {
    const user = await pickRoute('Social Media');

    await user.type(screen.getByLabelText('Name'), 'Anna Müller');
    await user.type(screen.getByLabelText('E-Mail'), 'anna@');
    await user.click(
      screen.getByRole('button', { name: 'Bewerbung abschicken' }),
    );

    expect(
      await screen.findByText(
        'Bitte gib eine E-Mail-Adresse ein, an die wir dir antworten können',
      ),
    ).toBeVisible();
  });

  it('explains missing privacy consent to assistive technology', async () => {
    const user = await pickRoute('Social Media');
    const checkbox = screen.getByRole('checkbox', {
      name: /Ich bin damit einverstanden/,
    });

    await user.click(
      screen.getByRole('button', { name: 'Bewerbung abschicken' }),
    );

    const error = await screen.findByRole('alert');

    expect(error).toHaveTextContent(
      'Ohne deine Einwilligung können wir deine Bewerbung nicht speichern',
    );
    expect(checkbox).toHaveAttribute('aria-invalid', 'true');
    expect(error).toHaveAttribute('id');
    expect(checkbox).toHaveAttribute('aria-describedby', error.id);
    expect(checkbox).toHaveAccessibleDescription(error.textContent);

    await user.click(checkbox);

    await waitFor(() => {
      expect(checkbox).not.toHaveAttribute('aria-invalid');
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  it('disables the submit button while the request is in flight', async () => {
    server.use(
      http.post('*/api/v1/applications', async () => {
        await delay(50);
        return HttpResponse.json({ applicationId: 'app-1' }, { status: 201 });
      }),
    );

    const user = await pickRoute('Social Media');
    await fillValidApplication(user);

    const button = screen.getByRole('button', { name: 'Bewerbung abschicken' });
    await user.click(button);

    expect(await screen.findByText('Wird abgeschickt …')).toBeVisible();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('replaces the form with the confirmation view naming the typed email', async () => {
    const user = await pickRoute('Social Media');
    await fillValidApplication(user);

    await user.click(
      screen.getByRole('button', { name: 'Bewerbung abschicken' }),
    );

    expect(await screen.findByText('Deine Bewerbung ist da!')).toBeVisible();
    expect(screen.getByText('anna@example.de')).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Bewerbung abschicken' }),
    ).not.toBeInTheDocument();
  });

  it('places a server field error under the field it belongs to', async () => {
    server.use(
      http.post('*/api/v1/applications', () =>
        validationProblem([{ field: 'email', code: 'EMAIL_INVALID' }]),
      ),
    );

    const user = await pickRoute('Social Media');
    await fillValidApplication(user);

    await user.click(
      screen.getByRole('button', { name: 'Bewerbung abschicken' }),
    );

    expect(
      await screen.findByText(
        'Bitte gib eine E-Mail-Adresse ein, an die wir dir antworten können',
      ),
    ).toBeVisible();
  });

  it('keeps the entered values and shows a retry message on a server failure', async () => {
    server.use(
      http.post(
        '*/api/v1/applications',
        () => new HttpResponse(null, { status: 500 }),
      ),
    );

    const user = await pickRoute('Social Media');
    await fillValidApplication(user);

    await user.click(
      screen.getByRole('button', { name: 'Bewerbung abschicken' }),
    );

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Bitte versuche es noch einmal',
      );
    });
    expect(screen.getByLabelText('E-Mail')).toHaveValue('anna@example.de');
  });

  it('keeps the form and shows a retry message for a non-201 response', async () => {
    server.use(
      http.post('*/api/v1/applications', () =>
        HttpResponse.json({ applicationId: 'app-1' }),
      ),
    );

    const user = await pickRoute('Social Media');
    await fillValidApplication(user);

    await user.click(
      screen.getByRole('button', { name: 'Bewerbung abschicken' }),
    );

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Bitte versuche es noch einmal',
      );
    });
    expect(
      screen.queryByText('Deine Bewerbung ist da!'),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText('E-Mail')).toHaveValue('anna@example.de');
  });

  it('keeps the form and shows a retry message for a missing application ID', async () => {
    server.use(
      http.post('*/api/v1/applications', () =>
        HttpResponse.json({}, { status: 201 }),
      ),
    );

    const user = await pickRoute('Social Media');
    await fillValidApplication(user);

    await user.click(
      screen.getByRole('button', { name: 'Bewerbung abschicken' }),
    );

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Bitte versuche es noch einmal',
      );
    });
    expect(
      screen.queryByText('Deine Bewerbung ist da!'),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText('E-Mail')).toHaveValue('anna@example.de');
  });

  it('keeps the form and shows a retry message for an empty application ID', async () => {
    server.use(
      http.post('*/api/v1/applications', () =>
        HttpResponse.json({ applicationId: '' }, { status: 201 }),
      ),
    );

    const user = await pickRoute('Social Media');
    await fillValidApplication(user);

    await user.click(
      screen.getByRole('button', { name: 'Bewerbung abschicken' }),
    );

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Bitte versuche es noch einmal',
      );
    });
    expect(
      screen.queryByText('Deine Bewerbung ist da!'),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText('E-Mail')).toHaveValue('anna@example.de');
  });

  it('clears the route and reloads the list on CATEGORY_UNAVAILABLE, keeping other values', async () => {
    server.use(
      http.post('*/api/v1/applications', () =>
        validationProblem([
          { field: 'categoryId', code: 'CATEGORY_UNAVAILABLE' },
        ]),
      ),
    );

    const user = await pickRoute('Social Media');
    await fillValidApplication(user);

    await user.click(
      screen.getByRole('button', { name: 'Bewerbung abschicken' }),
    );

    const select = screen.getByLabelText('Wie möchtest du uns helfen?');
    await waitFor(() => expect(select).toHaveValue(''));
    // Clearing the route hides fields 2–6, but their values stay in the form
    // state (see useApplicationSubmit.ts) — picking a category again brings
    // them straight back, unchanged.
    expect(screen.queryByLabelText('Name')).not.toBeInTheDocument();

    await user.selectOptions(select, 'Redaktion / Öffentlichkeitsarbeit');

    expect(screen.getByLabelText('Name')).toHaveValue('Anna Müller');
  });

  it('shows a retry button and no built-in fallback list when categories fail to load', async () => {
    server.use(
      http.get(
        '*/api/v1/categories',
        () => new HttpResponse(null, { status: 500 }),
      ),
    );

    const user = userEvent.setup();
    render(<ApplicationForm />);

    expect(
      await screen.findByText(
        'Die Bereiche für Vereinsarbeit konnten nicht geladen werden. Bitte versuche es noch einmal.',
      ),
    ).toBeVisible();
    expect(screen.getByLabelText('Wie möchtest du uns helfen?')).toBeDisabled();

    server.use(
      http.get('*/api/v1/categories', () =>
        HttpResponse.json({ categories: MOCK_CATEGORIES }),
      ),
    );
    await user.click(screen.getByRole('button', { name: 'Erneut versuchen' }));

    await waitFor(() =>
      expect(
        screen.getByLabelText('Wie möchtest du uns helfen?'),
      ).not.toBeDisabled(),
    );
  });

  it('keeps the two fixed routes selectable when the category list is empty', async () => {
    server.use(
      http.get('*/api/v1/categories', () =>
        HttpResponse.json({ categories: [] }),
      ),
    );

    render(<ApplicationForm />);

    expect(
      await screen.findByText(
        'Aktuell keine offenen Bereiche für Vereinsarbeit.',
      ),
    ).toBeVisible();
    const select = screen.getByLabelText('Wie möchtest du uns helfen?');
    expect(select).not.toBeDisabled();
    const optionValues = Array.from(select.querySelectorAll('option'))
      .filter((option) => option.value !== '')
      .map((option) => option.value);
    expect(optionValues).toEqual(['COMMUNITY', 'SUPPORTING_MEMBER']);
  });

  it('shows a single disabled placeholder option while categories are loading', () => {
    server.use(
      http.get('*/api/v1/categories', async () => {
        await delay('infinite');
      }),
    );

    render(<ApplicationForm />);

    const select = screen.getByLabelText('Wie möchtest du uns helfen?');
    expect(select).toBeDisabled();
    const options = Array.from(select.querySelectorAll('option'));
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent('Lädt …');
  });

  it('shows a single disabled placeholder option and no fixed routes when categories fail to load', async () => {
    server.use(
      http.get(
        '*/api/v1/categories',
        () => new HttpResponse(null, { status: 500 }),
      ),
    );

    render(<ApplicationForm />);

    await screen.findByText(
      'Die Bereiche für Vereinsarbeit konnten nicht geladen werden. Bitte versuche es noch einmal.',
    );

    const select = screen.getByLabelText('Wie möchtest du uns helfen?');
    expect(select).toBeDisabled();
    const options = Array.from(select.querySelectorAll('option'));
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent('Nicht verfügbar');
  });

  it('settles on exactly one correct category list under StrictMode double-invoke', async () => {
    let callCount = 0;
    server.use(
      http.get('*/api/v1/categories', async () => {
        callCount += 1;
        if (callCount === 1) {
          // The first (superseded) request resolves *after* the second one,
          // with a payload that must never win — proves the staleness guard
          // in useCategories, not just that the select ends up enabled.
          await delay(50);
          return HttpResponse.json({
            categories: [{ id: 'stale', label: 'Stale' }],
          });
        }
        return HttpResponse.json({ categories: MOCK_CATEGORIES });
      }),
    );

    render(
      <StrictMode>
        <ApplicationForm />
      </StrictMode>,
    );

    const select = screen.getByLabelText('Wie möchtest du uns helfen?');
    await waitFor(() => expect(select).not.toBeDisabled());

    const expectedOptionValues = [
      'COMMUNITY',
      ...MOCK_CATEGORIES.map((category) => category.id),
      'SUPPORTING_MEMBER',
    ];
    const optionValues = () =>
      Array.from(select.querySelectorAll('option'))
        .filter((option) => option.value !== '')
        .map((option) => option.value);
    expect(optionValues()).toEqual(expectedOptionValues);

    // Let the delayed, superseded response resolve too, and confirm it never
    // overwrites the already-settled, correct list with the stale one.
    await delay(60);
    expect(optionValues()).toEqual(expectedOptionValues);
  });

  it('shows an error, not an empty list, when the category response is not valid JSON', async () => {
    server.use(
      http.get(
        '*/api/v1/categories',
        () => new HttpResponse('not json', { status: 200 }),
      ),
    );

    render(<ApplicationForm />);

    await screen.findByText(
      'Die Bereiche für Vereinsarbeit konnten nicht geladen werden. Bitte versuche es noch einmal.',
    );
    expect(screen.getByLabelText('Wie möchtest du uns helfen?')).toBeDisabled();
  });

  it('shows an error, not an empty list, when the category response is missing the categories field', async () => {
    server.use(http.get('*/api/v1/categories', () => HttpResponse.json({})));

    render(<ApplicationForm />);

    await screen.findByText(
      'Die Bereiche für Vereinsarbeit konnten nicht geladen werden. Bitte versuche es noch einmal.',
    );
  });

  it('shows an error, not a partial list, when one category entry is missing required fields', async () => {
    server.use(
      http.get('*/api/v1/categories', () =>
        HttpResponse.json({
          categories: [MOCK_CATEGORIES[0], { label: 'Broken' }],
        }),
      ),
    );

    render(<ApplicationForm />);

    await screen.findByText(
      'Die Bereiche für Vereinsarbeit konnten nicht geladen werden. Bitte versuche es noch einmal.',
    );
  });

  it('has no detectable accessibility violations once the application fields are open', async () => {
    const { container } = render(<ApplicationForm />);
    const user = userEvent.setup();
    const select = screen.getByLabelText('Wie möchtest du uns helfen?');
    await waitFor(() => expect(select).not.toBeDisabled());
    await user.selectOptions(select, 'Social Media');

    await expectNoA11yViolations(container);
  });
});
