import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { expectNoA11yViolations } from '../../../test/a11y';
import { Footer } from './Footer';

function renderFooter(onBackToTop = vi.fn()) {
  return render(
    <Footer
      content={{
        backToTopLabel: 'Nach oben',
        copyright: 'Copyright 2026 ichbinhier e.V. – Alle Rechte vorbehalten.',
        donateHref: '#',
        donateLabel: 'Spende hier',
        contact: {
          title: 'Kontakt',
          talkToUsLabel: 'Sprich mit uns',
          talkToUsHref: '#',
          address: ['Postfach 25588', '10129 Berlin', 'info@ichbinhier.online'],
        },
        legal: {
          title: 'Rechtliches',
          imprintLabel: 'Impressum',
          imprintHref: '#',
          privacyLabel: 'Datenschutz',
          privacyHref: 'https://www.ichbinhier.eu/datenschutz',
        },
      }}
      onBackToTop={onBackToTop}
    />,
  );
}

describe('Footer', () => {
  it('renders the supplied contact and legal destinations', () => {
    renderFooter();

    expect(
      screen.getByRole('link', { name: 'Sprich mit uns' }),
    ).toHaveAttribute('href', '#');

    expect(screen.getByRole('link', { name: 'Impressum' })).toHaveAttribute(
      'href',
      '#',
    );

    expect(screen.getByRole('link', { name: 'Datenschutz' })).toHaveAttribute(
      'href',
      'https://www.ichbinhier.eu/datenschutz',
    );

    expect(screen.getByRole('link', { name: 'Spende hier' })).toHaveAttribute(
      'href',
      '#',
    );

    expect(screen.getByText('info@ichbinhier.online')).toBeVisible();
  });

  it('calls onBackToTop when the back-to-top button is pressed', async () => {
    const onBackToTop = vi.fn();
    const user = userEvent.setup();
    renderFooter(onBackToTop);

    await user.click(screen.getByRole('button', { name: 'Nach oben' }));

    expect(onBackToTop).toHaveBeenCalledOnce();
  });

  it('has no detectable accessibility violations', async () => {
    const { container } = renderFooter();

    await expectNoA11yViolations(container);
  });
});
