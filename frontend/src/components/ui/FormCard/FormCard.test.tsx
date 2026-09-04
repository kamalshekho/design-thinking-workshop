import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { expectNoA11yViolations } from '../../../test/a11y';
import { FormCard } from './FormCard';

describe('FormCard', () => {
  it('renders its children', () => {
    render(
      <FormCard>
        <p>Inhalt</p>
      </FormCard>,
    );

    expect(screen.getByText('Inhalt')).toBeVisible();
  });

  it('has no detectable accessibility violations', async () => {
    const { container } = render(
      <FormCard>
        <p>Inhalt</p>
      </FormCard>,
    );

    await expectNoA11yViolations(container);
  });
});
