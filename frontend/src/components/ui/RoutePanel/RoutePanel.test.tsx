import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { expectNoA11yViolations } from '../../../test/a11y';
import { RoutePanel } from './RoutePanel';

describe('RoutePanel', () => {
  it('renders the supplied direct-route content and destination', () => {
    render(
      <RoutePanel
        actionHref="https://example.org/community"
        actionLabel="Zur Aktionsgruppe"
        body="Du kannst sofort starten."
        title="Du bist sofort dabei."
        variant="community"
      />,
    );

    expect(
      screen.getByRole('heading', { name: 'Du bist sofort dabei.' }),
    ).toBeVisible();
    expect(
      screen.getByRole('link', { name: 'Zur Aktionsgruppe' }),
    ).toHaveAttribute('href', 'https://example.org/community');
  });

  it('has no detectable accessibility violations', async () => {
    const { container } = render(
      <RoutePanel
        actionHref="https://example.org/membership"
        actionLabel="Zum Fördermitgliedsantrag"
        body="Du unterstützt uns direkt."
        title="Du unterstützt uns direkt."
        variant="supporting-member"
      />,
    );

    await expectNoA11yViolations(container);
  });
});
