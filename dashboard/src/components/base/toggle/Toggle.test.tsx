import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Toggle } from './toggle';

describe('Toggle', () => {
  it('toggles via click and keyboard', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <Toggle
        label="Kategorie aktiv"
        hint="Neue Anfragen können diese Kategorie wählen."
        isSelected={false}
        onChange={onChange}
      />,
    );

    const toggle = screen.getByRole('switch', { name: /Kategorie aktiv/ });
    expect(toggle).not.toBeChecked();

    await user.click(toggle);
    expect(onChange).toHaveBeenNthCalledWith(1, true);

    toggle.focus();
    await user.keyboard(' ');
    expect(onChange).toHaveBeenNthCalledWith(2, true);
  });

  it('does not toggle when clicking the hint text', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <Toggle
        label="Kategorie aktiv"
        hint="Neue Anfragen können diese Kategorie wählen."
        isSelected={false}
        onChange={onChange}
      />,
    );

    await user.click(
      screen.getByText('Neue Anfragen können diese Kategorie wählen.'),
    );

    expect(onChange).not.toHaveBeenCalled();
  });

  it('supports aria-label without visible label text', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <Toggle
        aria-label="Social Media umschalten"
        isSelected={true}
        onChange={onChange}
      />,
    );

    const toggle = screen.getByRole('switch', {
      name: 'Social Media umschalten',
    });

    expect(toggle).toBeChecked();

    await user.click(toggle);
    expect(onChange).toHaveBeenCalledWith(false);
  });
});
