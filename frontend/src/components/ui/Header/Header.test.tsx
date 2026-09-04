import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { expectNoA11yViolations } from '../../../test/a11y';
import { Header } from './Header';

const navItems = [
  { label: 'Über uns', href: 'https://example.org/ueber-uns' },
  { label: 'Engagement', href: 'https://example.org/engagement' },
];

describe('Header', () => {
  it('renders the supplied navigation, logo and CTA destinations', () => {
    const { container } = render(
      <Header
        donateHref="https://example.org/spende"
        donateLabel="Spende"
        homeHref="https://example.org/"
        logoAlt="ichbinhier e.V."
        menuCloseLabel="Menü schließen"
        menuLabel="Menü öffnen"
        navItems={navItems}
        searchLabel="Suche"
      />,
    );

    expect(screen.getByRole('img', { name: 'ichbinhier e.V.' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Über uns' })).toHaveAttribute(
      'href',
      'https://example.org/ueber-uns',
    );
    expect(screen.getByRole('link', { name: 'Spende' })).toHaveAttribute(
      'href',
      'https://example.org/spende',
    );
    expect(screen.getByRole('button', { name: 'Suche' })).toBeVisible();
    // The menu button is mobile-only — CSS hides it above the 640px
    // breakpoint, which is the width jsdom renders at in this test, so its
    // accessible name isn't computed; assert on the attribute directly.
    expect(
      container.querySelector('[aria-label="Menü öffnen"]'),
    ).toBeInTheDocument();
  });

  it('opens and closes the mobile navigation with an accessible control', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Header
        donateHref="https://example.org/spende"
        donateLabel="Spende"
        homeHref="https://example.org/"
        logoAlt="ichbinhier e.V."
        menuCloseLabel="Menü schließen"
        menuLabel="Menü öffnen"
        navItems={navItems}
        searchLabel="Suche"
      />,
    );

    const menuButton = container.querySelector<HTMLButtonElement>(
      'button[aria-label="Menü öffnen"]',
    );
    if (!menuButton) throw new Error('Expected a mobile menu button');

    expect(menuButton).toHaveAttribute('aria-expanded', 'false');

    await user.click(menuButton);
    expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    expect(menuButton).toHaveAttribute('aria-label', 'Menü schließen');

    await user.click(screen.getByRole('link', { name: 'Über uns' }));
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('has no detectable accessibility violations', async () => {
    const { container } = render(
      <Header
        donateHref="https://example.org/spende"
        donateLabel="Spende"
        homeHref="https://example.org/"
        logoAlt="ichbinhier e.V."
        menuCloseLabel="Menü schließen"
        menuLabel="Menü öffnen"
        navItems={navItems}
        searchLabel="Suche"
      />,
    );

    await expectNoA11yViolations(container);
  });
});
