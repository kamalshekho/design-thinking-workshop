import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { expectNoA11yViolations } from '../../../test/a11y';
import { Checkbox } from './Checkbox';

describe('Checkbox', () => {
  it('uses its supplied copy as the accessible checkbox name', async () => {
    const user = userEvent.setup();

    render(<Checkbox>Ich stimme der Datenschutzerklärung zu.</Checkbox>);

    const checkbox = screen.getByRole('checkbox', {
      name: 'Ich stimme der Datenschutzerklärung zu.',
    });
    await user.click(checkbox);

    expect(checkbox).toBeChecked();
  });

  it('exposes the error state to assistive technology', () => {
    render(
      <Checkbox aria-invalid="true">
        Ich stimme der Datenschutzerklärung zu.
      </Checkbox>,
    );

    expect(screen.getByRole('checkbox')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });

  it('has no detectable accessibility violations', async () => {
    const { container } = render(
      <Checkbox>Ich stimme der Datenschutzerklärung zu.</Checkbox>,
    );

    await expectNoA11yViolations(container);
  });
});
