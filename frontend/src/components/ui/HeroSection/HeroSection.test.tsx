import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { expectNoA11yViolations } from '../../../test/a11y';
import { HeroSection } from './HeroSection';

describe('HeroSection', () => {
  it('renders the supplied tagline', () => {
    render(<HeroSection tagline="ichbinhier, damit Liebe lauter ist" />);

    expect(
      screen.getByText('ichbinhier, damit Liebe lauter ist'),
    ).toBeVisible();
  });

  it('has no detectable accessibility violations', async () => {
    const { container } = render(
      <HeroSection tagline="ichbinhier, damit Liebe lauter ist" />,
    );

    await expectNoA11yViolations(container);
  });
});
