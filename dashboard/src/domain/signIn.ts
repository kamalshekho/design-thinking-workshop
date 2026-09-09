/**
 * What the dashboard knows about the current Sign-in (`CONTEXT.md`) — three
 * states rather than a Staff member or `null`.
 *
 * The third state is the whole point. A Sign-in ends after twelve hours of
 * sliding inactivity (`A17`), and it ends in the middle of someone's work: the
 * dashboard then has to keep the screens, the filters and the unsent internal
 * notes alive while asking for a password again. "Nobody is signed in" and
 * "the Sign-in a Staff member was working under has run out" are therefore
 * different answers — the first is the sign-in screen, the second is the
 * sign-in screen *over* a dashboard that is still there.
 *
 * A union rather than a Staff member beside an `expired` flag: an expired
 * Sign-in without the Staff member it belonged to is a state the cover cannot
 * render, and this shape cannot express it.
 *
 * `Session` is deliberately not the word — the glossary spends it on Intro
 * session (`CONTEXT.md`).
 */

import type { StaffMember } from './staffMember';

export type SignIn =
  /** `GET /me` answered `401`: the sign-in screen, and nothing behind it. */
  | { kind: 'none' }
  | { kind: 'active'; staffMember: StaffMember }
  /** Ran out mid-work. The dashboard stays mounted under the cover. */
  | { kind: 'expired'; staffMember: StaffMember };

export const NO_SIGN_IN: SignIn = { kind: 'none' };

export function activeSignIn(staffMember: StaffMember): SignIn {
  return { kind: 'active', staffMember };
}

/**
 * The transition a `401` causes, applied to whatever the cache holds.
 *
 * Only an active Sign-in expires. The two other states are left alone on
 * purpose: a `401` while the cover is already up is the request that was in
 * flight when the Sign-in ran out, and a `401` while nobody is signed in is
 * the ordinary answer to a request the sign-out burst left behind
 * (`queries/session.ts`). Neither may re-decide what the dashboard is showing.
 */
export function expireSignIn(signIn: SignIn): SignIn {
  return signIn.kind === 'active'
    ? { kind: 'expired', staffMember: signIn.staffMember }
    : signIn;
}
