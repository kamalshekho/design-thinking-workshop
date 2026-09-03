import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { expectNoA11yViolations } from '../../../test/a11y';
import { Field } from './Field';

/**
 * Reference test for a UI component, and the proof that the a11y setup runs.
 * A ported control is expected to be covered like this: what the applicant
 * perceives, plus an axe pass.
 */
describe('Field', () => {
  it('links label, hint and error to the control', () => {
    render(
      <Field label="E-Mail" hint="Wir antworten dir hier" error="Bitte prüfen">
        {(aria) => <input type="email" {...aria} />}
      </Field>,
    );

    const input = screen.getByLabelText('E-Mail');
    expect(input).toHaveAccessibleDescription(
      'Bitte prüfen Wir antworten dir hier',
    );
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('describes nothing when there is no hint and no error', () => {
    render(
      <Field label="Name">{(aria) => <input type="text" {...aria} />}</Field>,
    );

    const input = screen.getByLabelText('Name');
    expect(input).not.toHaveAttribute('aria-describedby');
    expect(input).not.toHaveAttribute('aria-invalid');
  });

  it('has no detectable accessibility violations', async () => {
    const { container } = render(
      <Field label="E-Mail" error="Bitte prüfen">
        {(aria) => <input type="email" {...aria} />}
      </Field>,
    );

    await expectNoA11yViolations(container);
  });
});
