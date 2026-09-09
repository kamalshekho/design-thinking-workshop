/**
 * The sign-in screen: the page a dashboard nobody is signed in to shows — a
 * gate rather than a fourth sidebar item, because a login reachable from
 * inside the dashboard would guard nothing (`A16`).
 *
 * It is the framing and nothing else. The form is `SignInForm`, shared with
 * the cover an expired Sign-in puts over the dashboard (`app/SignInCover.tsx`);
 * what this file owns is that there is nothing behind it, which is why it is a
 * `<main>` filling the viewport and not a dialog.
 */

import type { SignInFormProps } from './SignInForm';
import { SignInForm } from './SignInForm';

type LoginScreenProps = Pick<
  SignInFormProps,
  'onSignIn' | 'failure' | 'isSubmitting'
>;

export function LoginScreen(props: LoginScreenProps) {
  return (
    <main className="bg-primary text-primary flex min-h-dvh items-start justify-center px-4 py-12 sm:items-center sm:py-8">
      <SignInForm {...props} />
    </main>
  );
}
