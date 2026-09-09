import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ApiProblem } from '@/api/problem';
import { de } from '@/content/de';
import { mockStaffMember } from '@/data/mockApplications';

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

async function submitCredentials(
  email: string,
  password: string,
): Promise<void> {
  const user = userEvent.setup();

  if (email !== '') {
    await user.type(field(de.auth.emailLabel), email);
  }
  if (password !== '') {
    await user.type(field(de.auth.passwordLabel), password);
  }

  await user.click(screen.getByRole('button', { name: de.auth.submit }));
}

describe('LoginScreen', () => {
  it('hands the credentials up, with the address trimmed', async () => {
    const onSignIn = vi.fn();

    render(<LoginScreen onSignIn={onSignIn} />);

    await submitCredentials(`  ${mockStaffMember.email}  `, 'geheim');

    expect(onSignIn).toHaveBeenCalledWith({
      email: mockStaffMember.email,
      password: 'geheim',
    });
  });

  it('says nothing until the form is submitted', async () => {
    const user = userEvent.setup();

    render(<LoginScreen onSignIn={vi.fn()} />);

    await user.type(field(de.auth.emailLabel), 'not-an-email');

    expect(screen.queryByText(de.auth.emailInvalid)).not.toBeInTheDocument();
  });

  it('flags an unfinished address and puts focus back in the field', async () => {
    const onSignIn = vi.fn();

    render(<LoginScreen onSignIn={onSignIn} />);

    await submitCredentials('not-an-email', 'geheim');

    expect(screen.getByText(de.auth.emailInvalid)).toBeInTheDocument();
    expect(field(de.auth.emailLabel)).toHaveFocus();
    expect(onSignIn).not.toHaveBeenCalled();
  });

  it('flags a missing password on the password field', async () => {
    render(<LoginScreen onSignIn={vi.fn()} />);

    await submitCredentials(mockStaffMember.email, '');

    expect(screen.getByText(de.auth.passwordRequired)).toBeInTheDocument();
    expect(field(de.auth.passwordLabel)).toHaveFocus();
  });

  /**
   * Where a rejection sits is the decision issue #37 recorded: the two the
   * backend can raise are about the submission rather than about one field,
   * so they read above the form. `INVALID_CREDENTIALS` is also the reason
   * neither says which field was wrong — it refuses to tell an outsider which
   * addresses have an account.
   */
  it('words a rejected Sign-in above the form, not under a field', () => {
    render(
      <LoginScreen
        onSignIn={vi.fn()}
        failure={new ApiProblem({ status: 401, code: 'INVALID_CREDENTIALS' })}
      />,
    );

    const alert = screen.getByRole('alert');
    const email = field(de.auth.emailLabel);

    expect(alert).toHaveTextContent(de.errors.codes.INVALID_CREDENTIALS);
    // Above the form, and above the field it deliberately does not blame.
    expect(alert.closest('form')).toBe(email.closest('form'));
    expect(email).not.toHaveAttribute('aria-invalid', 'true');
    expect(field(de.auth.passwordLabel)).not.toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(screen.queryByText(/Konto/)).not.toBeInTheDocument();
  });

  it('words a throttled address above the form too', () => {
    render(
      <LoginScreen
        onSignIn={vi.fn()}
        failure={
          new ApiProblem({
            status: 429,
            code: 'RATE_LIMITED',
            retryAfterSeconds: 300,
          })
        }
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(
      de.errors.codes.RATE_LIMITED,
    );
  });

  /**
   * A request the network never delivered carries no `code`, and the screen
   * still has to say something — the general wording, because the dashboard
   * genuinely does not know what happened.
   */
  it('words a request that never reached the backend generally', () => {
    render(
      <LoginScreen onSignIn={vi.fn()} failure={new TypeError('offline')} />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(de.errors.general);
  });

  it('drops the rejection once a field needs fixing again', async () => {
    render(
      <LoginScreen
        onSignIn={vi.fn()}
        failure={new ApiProblem({ status: 401, code: 'INVALID_CREDENTIALS' })}
      />,
    );

    await submitCredentials('not-an-email', 'geheim');

    expect(screen.getByText(de.auth.emailInvalid)).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('cannot be submitted twice while the request is in flight', () => {
    render(<LoginScreen onSignIn={vi.fn()} isSubmitting />);

    expect(screen.getByRole('button', { name: de.auth.submit })).toBeDisabled();
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
