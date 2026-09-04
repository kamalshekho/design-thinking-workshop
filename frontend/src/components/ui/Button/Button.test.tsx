import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { expectNoA11yViolations } from '../../../test/a11y';
import { Button } from './Button';

describe('Button', () => {
  it('uses the supplied label and native submit behaviour', () => {
    render(<Button type="submit">Bewerbung abschicken</Button>);

    expect(
      screen.getByRole('button', { name: 'Bewerbung abschicken' }),
    ).toHaveAttribute('type', 'submit');
  });

  it('announces loading and prevents repeat submission', () => {
    render(
      <Button isLoading loadingLabel="Wird abgeschickt …">
        Bewerbung abschicken
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Wird abgeschickt …' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('renders a semantic link for a supplied destination', () => {
    render(<Button href="https://example.org">Weiter</Button>);

    expect(screen.getByRole('link', { name: 'Weiter' })).toHaveAttribute(
      'href',
      'https://example.org',
    );
  });

  it('has no detectable accessibility violations', async () => {
    const { container } = render(<Button>Weiter</Button>);

    await expectNoA11yViolations(container);
  });
});
