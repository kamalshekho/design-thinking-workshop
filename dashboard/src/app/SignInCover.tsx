/**
 * The sign-in form over a dashboard that is still there, because the Sign-in
 * ran out mid-work (`API.md`, "When a Sign-in expires").
 *
 * A cover, not a route. A Sign-in lasts twelve hours of sliding inactivity
 * (`A17`), so it ends in the middle of someone's work — with a filter set, a
 * drawer open and a note half typed. Rendering `LoginScreen` in its place
 * would unmount all of it, and the Staff member would come back to Anfragen's
 * default view with their text gone. So the shell stays mounted underneath and
 * this sits on top of it: the work survives because nothing was ever
 * unmounted, and after signing in again the dashboard is where it was.
 *
 * Three things follow from being a dialog rather than a screen:
 *
 * - the shell behind it is `inert` (`AppShell`), so the sidebar and the rows
 *   underneath cannot be clicked or reached with Tab. A dashboard that looks
 *   covered but still answers keystrokes would let a Staff member edit an
 *   Application through a Sign-in that no longer exists, and every one of
 *   those writes would be refused;
 * - it is `aria-modal`, and the fields are labelled by the dialog rather than
 *   by the sidebar behind it, so a screen reader is told the dashboard is not
 *   the thing to read right now;
 * - it says *why* it is here. "Anmelden" over a dashboard that was working a
 *   moment ago reads as a fault; naming the expiry, and promising the typed
 *   text is still there, is the difference between an interruption and a loss.
 *
 * It carries no dismiss and no backdrop click: there is nothing to go back to
 * until a Sign-in exists again. The only other way out is "Abmelden" in the
 * sidebar, which is behind the `inert` shell — and an expired Sign-in is
 * already signed out, so there is nothing there to press.
 */

import { de } from '@/content/de';
import type { StaffMember } from '@/domain/staffMember';
import type { SignInFormProps } from '@/features/auth/SignInForm';
import { SignInForm } from '@/features/auth/SignInForm';

type SignInCoverProps = Pick<
  SignInFormProps,
  'onSignIn' | 'failure' | 'isSubmitting'
> & {
  /** Whose Sign-in ran out — the address the form starts with. */
  staffMember: StaffMember;
};

export function SignInCover({ staffMember, ...form }: SignInCoverProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={de.auth.expiredTitle}
      className="bg-overlay/70 fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 py-12 backdrop-blur-sm sm:items-center sm:py-8"
    >
      <SignInForm
        {...form}
        title={de.auth.expiredTitle}
        subtitle={de.auth.expiredSubtitle}
        initialEmail={staffMember.email}
      />
    </div>
  );
}
