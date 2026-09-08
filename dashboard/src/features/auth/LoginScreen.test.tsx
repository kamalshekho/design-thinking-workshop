import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { de } from '@/content/de';
import { currentStaffMember } from '@/data/currentStaffMember';

import { LoginScreen } from './LoginScreen';

/**
 * `base/input` keeps the required marker in the DOM and hides it with a
 * Tailwind class, so under jsdom — where no stylesheet runs — the accessible
 * label reads "E-Mail *". The field is matched on the label copy alone rather
 * than on that artefact, and `selector` keeps the loose match off the password
 * field's own visibility toggle, whose label starts with the same word.
 */
function field(label: string): HTMLElement {
  return screen.getByLabelText(label, { exact: false, selector: 'input' });
}

describe('LoginScreen', () => {
  it('hands the signed-in Staff member back on a valid submit', async () => {
    const user = userEvent.setup();
    const onSignIn = vi.fn();

    render(<LoginScreen onSignIn={onSignIn} />);

    await user.type(field(de.auth.emailLabel), currentStaffMember.email);
    await user.type(field(de.auth.passwordLabel), 'anything');
    await user.click(screen.getByRole('button', { name: de.auth.submit }));

    expect(onSignIn).toHaveBeenCalledWith(currentStaffMember);
  });

  it('says nothing until the form is submitted', async () => {
    const user = userEvent.setup();

    render(<LoginScreen onSignIn={vi.fn()} />);

    await user.type(field(de.auth.emailLabel), 'not-an-email');

    expect(screen.queryByText(de.auth.emailInvalid)).not.toBeInTheDocument();
  });

  it('flags an unfinished address and puts focus back in the field', async () => {
    const user = userEvent.setup();
    const onSignIn = vi.fn();

    render(<LoginScreen onSignIn={onSignIn} />);

    await user.type(field(de.auth.emailLabel), 'not-an-email');
    await user.type(field(de.auth.passwordLabel), 'anything');
    await user.click(screen.getByRole('button', { name: de.auth.submit }));

    expect(screen.getByText(de.auth.emailInvalid)).toBeInTheDocument();
    expect(field(de.auth.emailLabel)).toHaveFocus();
    expect(onSignIn).not.toHaveBeenCalled();
  });

  it('flags a missing password on the password field', async () => {
    const user = userEvent.setup();

    render(<LoginScreen onSignIn={vi.fn()} />);

    await user.type(field(de.auth.emailLabel), currentStaffMember.email);
    await user.click(screen.getByRole('button', { name: de.auth.submit }));

    expect(screen.getByText(de.auth.passwordRequired)).toBeInTheDocument();
    expect(field(de.auth.passwordLabel)).toHaveFocus();
  });

  /**
   * The wording is the point of this test, not the flag: it says only that
   * the two together are wrong, because the contract's `INVALID_CREDENTIALS`
   * refuses to tell an outsider which addresses have an account.
   */
  it('rejects an address no Staff member has without saying so', async () => {
    const user = userEvent.setup();

    render(<LoginScreen onSignIn={vi.fn()} />);

    await user.type(field(de.auth.emailLabel), 'someone@example.org');
    await user.type(field(de.auth.passwordLabel), 'anything');
    await user.click(screen.getByRole('button', { name: de.auth.submit }));

    expect(
      screen.getByText(de.errors.codes.INVALID_CREDENTIALS),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Konto/)).not.toBeInTheDocument();
  });

  it('offers no password reset link and no stay-signed-in box', () => {
    render(<LoginScreen onSignIn={vi.fn()} />);

    expect(screen.queryAllByRole('link')).toHaveLength(0);
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.getByText(de.auth.passwordResetHint)).toBeInTheDocument();
  });

  it('labels the password visibility toggle in German', () => {
    render(<LoginScreen onSignIn={vi.fn()} />);

    expect(
      screen.getByRole('button', { name: de.fields.togglePassword }),
    ).toBeInTheDocument();
  });
});
