/**
 * The sign-in form: one `ui/card.tsx` card, and nothing around it.
 *
 * It is a component of its own because the dashboard asks for a password in
 * two places, and they are not the same place. `LoginScreen` is the page a
 * dashboard nobody is signed in to shows; `app/SignInCover.tsx` is the dialog
 * over a dashboard that is still there, because the Sign-in ran out mid-work
 * (issue #40). The framing differs, the wording differs, the form does not.
 *
 * No wordmark, no marketing panel beside it — neither carries information the
 * person signing in needs, and both made the one thing this card is for share
 * the page with decoration.
 *
 * Two things the form does not have, each because it would be dead UI: no
 * "Angemeldet bleiben" (the Sign-in's twelve hours of sliding inactivity are
 * the backend's, and there is no second duration to choose), and no "Passwort
 * vergessen?" link — the hint under the fields says who to ask instead.
 *
 * It stays prop-driven: it raises credentials, and takes the request's
 * outcome back as a problem and a pending flag. The mutation behind it lives
 * in `App` (ADR-0006), which is what lets every test here run without a
 * `QueryClient` or a stubbed `fetch`.
 *
 * **Where a failure sits is decided by what it is about** (issue #37). The
 * three checks the form makes itself each name a field, so they read as a
 * hint under that field and it takes focus. A rejected Sign-in does not: the
 * backend's `INVALID_CREDENTIALS` refuses to say which of the two fields was
 * wrong, and `RATE_LIMITED` is about neither — so both read above the fields,
 * where they belong to the submission rather than to an input.
 */

import { Mail01 } from '@untitledui/icons';
import { useRef, useState } from 'react';

import { problemCode } from '@/api/problem';
import type { Credentials } from '@/api/session';
import { Button } from '@/components/base/buttons/button';
import { Input } from '@/components/base/input/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { de } from '@/content/de';
import { errorMessage } from '@/content/errorMessage';

import type { CredentialIssue } from './validateCredentials';
import { validateCredentials } from './validateCredentials';

type Field = 'email' | 'password';

type FieldError = {
  field: Field;
  message: string;
};

/**
 * Each check belongs to the field a Staff member has to change to get past
 * it, which is also the field that takes focus after a failed submit.
 */
const fieldErrors: Record<CredentialIssue, FieldError> = {
  'email-required': { field: 'email', message: de.auth.emailRequired },
  'email-invalid': { field: 'email', message: de.auth.emailInvalid },
  'password-required': { field: 'password', message: de.auth.passwordRequired },
};

export type SignInFormProps = {
  onSignIn: (credentials: Credentials) => void;
  /**
   * Whatever the last submit raised, or `null` when it raised nothing. Not a
   * code, because a request the network never delivered has none — and the
   * form has to say something in that case too, which `errorMessage` words
   * as the general failure.
   */
  failure?: unknown;
  /** While the request is in flight, so the button cannot be pressed twice. */
  isSubmitting?: boolean;
  /** The heading above the fields; the cover states its own reason instead. */
  title?: string;
  subtitle?: string;
  /**
   * The address the field starts with. The cover fills in the Staff member
   * whose Sign-in ran out: they are signing in again, not choosing an account,
   * and the address is already in the sidebar behind the dialog. Somebody else
   * can still type over it — and `useSignIn` drops the work when they do.
   */
  initialEmail?: string;
};

export function SignInForm({
  onSignIn,
  failure = null,
  isSubmitting = false,
  title = de.auth.title,
  subtitle = de.auth.subtitle,
  initialEmail = '',
}: SignInFormProps) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  /**
   * Validation runs on submit, not on every keystroke — the same reason
   * `CategoryDialog` waits: an address is invalid for most of the time it is
   * being typed, and saying so as it happens is noise rather than help.
   */
  const [error, setError] = useState<FieldError | null>(null);

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  /**
   * A field the Staff member still has to fix outranks the last request's
   * rejection: the request was about credentials that have since changed, and
   * showing both would put two answers on one screen.
   */
  const submissionFailure =
    error === null && failure !== null && failure !== undefined
      ? errorMessage(problemCode(failure))
      : null;

  function submit(): void {
    const check = validateCredentials(email, password);

    if (check.ok) {
      setError(null);
      onSignIn(check.credentials);
      return;
    }

    const fieldError = fieldErrors[check.issue];
    setError(fieldError);
    (fieldError.field === 'email' ? emailRef : passwordRef).current?.focus();
  }

  return (
    <Card className="w-full max-w-md gap-5">
      <CardHeader className="flex flex-col gap-1.5">
        <CardTitle className="tracking-heading text-2xl">{title}</CardTitle>
        <CardDescription>{subtitle}</CardDescription>
      </CardHeader>

      <CardContent>
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
          className="flex flex-col gap-4"
        >
          {submissionFailure !== null && (
            <p
              role="alert"
              className="border-utility-red-200 bg-bg-error-primary text-text-error-primary rounded-lg border px-3.5 py-3 text-sm"
            >
              {submissionFailure}
            </p>
          )}

          <Input
            ref={emailRef}
            type="email"
            name="email"
            size="md"
            label={de.auth.emailLabel}
            placeholder={de.auth.emailPlaceholder}
            icon={Mail01}
            autoComplete="email"
            /*
              Both places this form appears hold nothing else to read past —
              the screen is the form alone, and the cover is a modal dialog
              over an `inert` dashboard — which is the case
              `jsx-a11y/no-autofocus` guards against. The rejection above the
              fields is read out by its `role="alert"` whichever field has
              focus.
            */
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            isRequired
            hideRequiredIndicator
            isInvalid={error?.field === 'email'}
            hint={error?.field === 'email' ? error.message : undefined}
            value={email}
            onChange={setEmail}
          />

          <Input
            ref={passwordRef}
            type="password"
            name="password"
            size="md"
            label={de.auth.passwordLabel}
            autoComplete="current-password"
            isRequired
            hideRequiredIndicator
            isInvalid={error?.field === 'password'}
            hint={error?.field === 'password' ? error.message : undefined}
            value={password}
            onChange={setPassword}
          />

          <Button
            type="submit"
            size="lg"
            className="mt-1 w-full"
            isLoading={isSubmitting}
            isDisabled={isSubmitting}
          >
            {de.auth.submit}
          </Button>

          <p className="text-tertiary text-sm">{de.auth.passwordResetHint}</p>
        </form>
      </CardContent>
    </Card>
  );
}
