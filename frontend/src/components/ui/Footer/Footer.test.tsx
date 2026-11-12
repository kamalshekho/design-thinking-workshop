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
        copyright:
          'Copyright 2026 Musterverein e.V. – Alle Rechte vorbehalten.',
        donateHref: 'https://example.org/spende',
        donateLabel: 'SPENDE HIER',
        kontakt: {
          title: 'Kontakt',
          talkToUsLabel: 'Sprich mit uns',
          talkToUsHref: 'https://example.org/kontakt',
          address: [
            'Musterstraße 1',
            '12345 Musterstadt',
            'kontakt@example.org',
          ],
        },
        rechtliches: {
          title: 'Rechtliches',
          impressumLabel: 'Impressum',
          impressumHref: 'https://example.org/impressum',
          datenschutzLabel: 'Datenschutz',
          datenschutzHref: 'https://example.org/datenschutz',
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
    ).toHaveAttribute('href', 'https://example.org/kontakt');
    expect(screen.getByRole('link', { name: 'Impressum' })).toHaveAttribute(
      'href',
      'https://example.org/impressum',
    );
    expect(screen.getByRole('link', { name: 'Datenschutz' })).toHaveAttribute(
      'href',
      'https://example.org/datenschutz',
    );
    expect(screen.getByText('kontakt@example.org')).toBeVisible();
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
