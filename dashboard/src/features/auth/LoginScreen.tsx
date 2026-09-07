/**
 * The sign-in screen. It is what the application renders while no Staff
 * member is signed in — a gate rather than a fourth sidebar item, because a
 * login reachable from inside the dashboard would guard nothing (`A16`).
 *
 * The screen is the form and nothing else: one `ui/card.tsx` card centred on
 * `bg-primary`. No wordmark, no marketing panel beside it — neither carries
 * information the person signing in needs, and both made the one thing this
 * screen is for share the page with decoration.
 *
 * Three things the form does not have, each because it would be dead UI: no
 * "Angemeldet bleiben" (no session to keep), no "Passwort vergessen?" link
 * (no reset flow behind it — the hint under the fields says who to ask
 * instead), and no loading state on the button, since the check is a local
 * function and a spinner would be theatre.
 */

import { Mail01 } from '@untitledui/icons';
import { useRef, useState } from 'react';

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
import type { StaffMember } from '@/domain/staffMember';

import type { SignInFailureReason } from './signIn';
import { signIn } from './signIn';

type Field = 'email' | 'password';

type FieldError = {
  field: Field;
  message: string;
};

/**
 * Each failure belongs to the field a Staff member has to change to get past
 * it, which is also the field that takes focus after a failed submit.
 */
const fieldErrors: Record<SignInFailureReason, FieldError> = {
  'email-required': { field: 'email', message: de.auth.emailRequired },
  'email-invalid': { field: 'email', message: de.auth.emailInvalid },
  'unknown-account': { field: 'email', message: de.auth.unknownAccount },
  'password-required': { field: 'password', message: de.auth.passwordRequired },
};

type LoginScreenProps = {
  onSignIn: (staffMember: StaffMember) => void;
};

export function LoginScreen({ onSignIn }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  /**
   * Validation runs on submit, not on every keystroke — the same reason
   * `CategoryDialog` waits: an address is invalid for most of the time it is
   * being typed, and saying so as it happens is noise rather than help.
   */
  const [error, setError] = useState<FieldError | null>(null);

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  function submit(): void {
    const result = signIn(email, password);

    if (result.ok) {
      setError(null);
      onSignIn(result.staffMember);
      return;
    }

    const failure = fieldErrors[result.reason];
    setError(failure);
    (failure.field === 'email' ? emailRef : passwordRef).current?.focus();
  }

  return (
    <main className="bg-primary text-primary flex min-h-dvh items-start justify-center px-4 py-12 sm:items-center sm:py-8">
      <Card className="w-full max-w-md gap-5">
        <CardHeader className="flex flex-col gap-1.5">
          <CardTitle className="tracking-heading text-2xl">
            {de.auth.title}
          </CardTitle>
          <CardDescription>{de.auth.subtitle}</CardDescription>
        </CardHeader>

        <CardContent>
          {/*
            `noValidate` hands validation to `signIn`, so one code path
            decides what is wrong and the message is German copy from `de.ts`
            rather than the browser's own bubble.
          */}
          <form
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
            className="flex flex-col gap-4"
          >
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
                The screen is this one form and holds nothing else to read
                past, which is the case `jsx-a11y/no-autofocus` guards against.
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

            <Button type="submit" size="lg" className="mt-1 w-full">
              {de.auth.submit}
            </Button>

            {/*
              Stays inside the card, and stays because it is the only answer
              a locked-out Staff member gets — the card has no reset link.
            */}
            <p className="text-tertiary text-sm">{de.auth.passwordResetHint}</p>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
