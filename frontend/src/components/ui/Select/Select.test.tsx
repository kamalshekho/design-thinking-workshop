import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { expectNoA11yViolations } from '../../../test/a11y';
import { Field } from '../Field/Field';
import { Select } from './Select';

describe('Select', () => {
  it('accepts Field ARIA wiring and preserves native selection behaviour', () => {
    render(
      <Field label="Zeit pro Woche" error="Bitte wählen">
        {(aria) => (
          <Select defaultValue="" required {...aria}>
            <option disabled value="">
              Bitte wählen …
            </option>
            <option value="one-to-two">1–2 Stunden</option>
          </Select>
        )}
      </Field>,
    );

    const select = screen.getByLabelText('Zeit pro Woche');
    expect(select).toHaveValue('');
    expect(select).toHaveAttribute('aria-invalid', 'true');
    expect(select).toHaveAccessibleDescription('Bitte wählen');
  });

  it('supports disabled native selects', () => {
    render(
      <Field label="Zeit pro Woche">
        {(aria) => (
          <Select disabled {...aria}>
            <option>Bitte wählen …</option>
          </Select>
        )}
      </Field>,
    );

    expect(screen.getByLabelText('Zeit pro Woche')).toBeDisabled();
  });

  it('has no detectable accessibility violations', async () => {
    const { container } = render(
      <Field label="Zeit pro Woche">
        {(aria) => (
          <Select defaultValue="" required {...aria}>
            <option disabled value="">
              Bitte wählen …
            </option>
            <option value="one-to-two">1–2 Stunden</option>
          </Select>
        )}
      </Field>,
    );

    await expectNoA11yViolations(container);
  });
});
