import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { expectNoA11yViolations } from '../../../test/a11y';
import { Field } from '../Field/Field';
import { Input } from './Input';

describe('Input', () => {
  it('accepts Field ARIA wiring and preserves native input behaviour', () => {
    render(
      <Field label="E-Mail" error="Bitte prüfen">
        {(aria) => (
          <Input type="email" placeholder="name@example.org" {...aria} />
        )}
      </Field>,
    );

    const input = screen.getByLabelText('E-Mail');
    expect(input).toHaveAttribute('type', 'email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Bitte prüfen');
  });

  it('has no detectable accessibility violations', async () => {
    const { container } = render(
      <Field label="Name">
        {(aria) => <Input placeholder="Name" {...aria} />}
      </Field>,
    );

    await expectNoA11yViolations(container);
  });
});
