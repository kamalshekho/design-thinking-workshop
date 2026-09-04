import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { expectNoA11yViolations } from '../../../test/a11y';
import { Footer } from './Footer';

const socialLinks = [
  {
    label: 'Facebook',
    href: 'https://example.org/facebook',
    icon: 'facebook.svg',
  },
  {
    label: 'Instagram',
    href: 'https://example.org/instagram',
    icon: 'instagram.svg',
  },
];

function renderFooter(onBackToTop = vi.fn()) {
  return render(
    <Footer
      content={{
        backToTopLabel: 'Nach oben',
        copyright: 'Copyright 2026 ichbinhier e.V. – Alle Rechte vorbehalten.',
        donateHref: 'https://example.org/spende',
        donateLabel: 'SPENDE HIER',
        kontakt: {
          title: 'Kontakt',
          talkToUsLabel: 'Sprich mit uns',
          talkToUsHref: 'https://example.org/kontakt',
          address: ['Postfach 25588', '10129 Berlin', 'info@ichbinhier.online'],
        },
        rechtliches: {
          title: 'Rechtliches',
          impressumLabel: 'Impressum',
          impressumHref: 'https://example.org/impressum',
          datenschutzLabel: 'Datenschutz',
          datenschutzHref: 'https://example.org/datenschutz',
        },
        socialLinks,
      }}
      onBackToTop={onBackToTop}
    />,
  );
}

describe('Footer', () => {
  it('renders the supplied contact, legal and social destinations', () => {
    renderFooter();

    expect(
      screen.getByRole('link', { name: 'Sprich mit uns' }),
    ).toHaveAttribute('href', 'https://example.org/kontakt');
    expect(screen.getByRole('link', { name: 'Impressum' })).toHaveAttribute(
      'href',
      'https://example.org/impressum',
    );
    expect(screen.getByRole('link', { name: 'Datenschutz' })).toHaveAttribute(
      'href',
      'https://example.org/datenschutz',
    );
    expect(screen.getByRole('link', { name: 'Facebook' })).toHaveAttribute(
      'href',
      'https://example.org/facebook',
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
