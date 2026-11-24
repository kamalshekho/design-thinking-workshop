import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Checkbox } from './checkbox';

describe('Checkbox', () => {
  it('toggles via click and keyboard when rendered standalone', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <Checkbox
        aria-label="Eintrag auswählen"
        isSelected={false}
        onChange={onChange}
      />,
    );

    const checkbox = screen.getByRole('checkbox', {
      name: 'Eintrag auswählen',
    });
    expect(checkbox).not.toBeChecked();

    await user.click(checkbox);
    expect(onChange).toHaveBeenNthCalledWith(1, true);

    checkbox.focus();
    await user.keyboard(' ');
    expect(onChange).toHaveBeenNthCalledWith(2, true);
  });
});
