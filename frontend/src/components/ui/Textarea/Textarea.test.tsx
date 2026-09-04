import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { expectNoA11yViolations } from '../../../test/a11y';
import { Field } from '../Field/Field';
import { Textarea } from './Textarea';

describe('Textarea', () => {
  it('accepts Field ARIA wiring and preserves native textarea behaviour', () => {
    render(
      <Field label="Erzähl uns kurz von dir" hint="Vier Sätze reichen.">
        {(aria) => <Textarea placeholder="Was bringst du mit?" {...aria} />}
      </Field>,
    );

    const textarea = screen.getByLabelText('Erzähl uns kurz von dir');
    expect(textarea).toHaveAttribute('placeholder', 'Was bringst du mit?');
    expect(textarea).toHaveAccessibleDescription('Vier Sätze reichen.');
  });

  it('supports disabled native textareas', () => {
    render(
      <Field label="Erzähl uns kurz von dir">
        {(aria) => <Textarea disabled {...aria} />}
      </Field>,
    );

    expect(screen.getByLabelText('Erzähl uns kurz von dir')).toBeDisabled();
  });

  it('has no detectable accessibility violations', async () => {
    const { container } = render(
      <Field label="Erzähl uns kurz von dir" error="Bitte prüfen">
        {(aria) => <Textarea {...aria} />}
      </Field>,
    );

    await expectNoA11yViolations(container);
  });
});
