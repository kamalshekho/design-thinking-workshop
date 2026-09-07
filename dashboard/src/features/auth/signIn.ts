/**
 * Stands in for the sign-in the backend will own (`A16`, issue #16).
 *
 * It checks the address against the Staff members the dashboard knows about
 * and ignores the password. A password check needs a credential store this
 * application does not have, and verifying one here would only look like
 * authentication — the same reason `mockApplications.ts` is a named mock
 * rather than a fake API. The screen says so in words.
 *
 * The validation order is the order the fields are read: an empty or
 * malformed address is reported before the password is looked at, so one
 * submit raises the first thing that needs fixing, not all of them.
 */

import { currentStaffMember } from '@/data/currentStaffMember';
import type { StaffMember } from '@/domain/staffMember';

export type SignInFailureReason =
  'email-required' | 'email-invalid' | 'password-required' | 'unknown-account';

export type SignInResult =
  | { ok: true; staffMember: StaffMember }
  | { ok: false; reason: SignInFailureReason };

/**
 * Deliberately loose: it rejects what is obviously unfinished — no `@`, no
 * dot in the domain, whitespace inside — and leaves the rest to the address
 * lookup below. A stricter pattern would reject valid addresses.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** The one Staff member the mock data knows, same as the account card's. */
const knownStaffMembers: readonly StaffMember[] = [currentStaffMember];

export function signIn(email: string, password: string): SignInResult {
  const address = email.trim();

  if (address === '') {
    return { ok: false, reason: 'email-required' };
  }

  if (!EMAIL_PATTERN.test(address)) {
    return { ok: false, reason: 'email-invalid' };
  }

  if (password === '') {
    return { ok: false, reason: 'password-required' };
  }

  const staffMember = knownStaffMembers.find(
    (candidate) => candidate.email.toLowerCase() === address.toLowerCase(),
  );

  if (!staffMember) {
    return { ok: false, reason: 'unknown-account' };
  }

  return { ok: true, staffMember };
}
