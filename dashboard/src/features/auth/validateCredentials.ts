/**
 * What the sign-in screen checks before it sends anything.
 *
 * It replaces the `signIn.ts` that stood in for the backend: the Sign-in is
 * real now (`POST /api/v1/staff/session`, issue #36), so nothing here looks
 * at a password or asks whether an address has an account — the backend
 * refuses to answer that second question at all, and a screen that answered
 * it locally would leak what addresses exist (`API.md`, "Errors").
 *
 * What is left is the part a request cannot improve on: an empty or plainly
 * unfinished address, and an empty password. The order is the order the
 * fields are read, so one submit raises the first thing that needs fixing
 * rather than all of them.
 */

import type { Credentials } from '@/api/session';

export type CredentialIssue =
  'email-required' | 'email-invalid' | 'password-required';

export type CredentialsCheck =
  | { ok: true; credentials: Credentials }
  | { ok: false; issue: CredentialIssue };

/**
 * Deliberately loose: it rejects what is obviously unfinished — no `@`, no
 * dot in the domain, whitespace inside — and leaves the rest to the backend.
 * A stricter pattern would reject valid addresses.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateCredentials(
  email: string,
  password: string,
): CredentialsCheck {
  const address = email.trim();

  if (address === '') {
    return { ok: false, issue: 'email-required' };
  }

  if (!EMAIL_PATTERN.test(address)) {
    return { ok: false, issue: 'email-invalid' };
  }

  if (password === '') {
    return { ok: false, issue: 'password-required' };
  }

  return { ok: true, credentials: { email: address, password } };
}
