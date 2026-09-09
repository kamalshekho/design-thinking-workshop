import { describe, expect, it } from 'vitest';

import { activeSignIn, expireSignIn, NO_SIGN_IN } from './signIn';
import type { StaffMember } from './staffMember';

const staffMember: StaffMember = {
  id: 'staff-1',
  name: 'Ashton Blackwell',
  email: 'ashton.blackwell@ichbinhier.online',
};

/**
 * The one transition a `401` causes. It is a function rather than three lines
 * inside `markSignInExpired` because what it refuses to do is the point: a
 * `401` may not invent a Sign-in, and it may not re-decide one that is already
 * gone — which is what keeps the burst of `401`s a sign-out leaves behind from
 * putting the cover up on the way out (`queries/session.ts`).
 */
describe('expireSignIn', () => {
  it('expires an active Sign-in, keeping the Staff member', () => {
    expect(expireSignIn(activeSignIn(staffMember))).toEqual({
      kind: 'expired',
      staffMember,
    });
  });

  it('leaves an expired Sign-in as it is', () => {
    const expired = expireSignIn(activeSignIn(staffMember));

    expect(expireSignIn(expired)).toEqual(expired);
  });

  it('does not invent a Sign-in where there is none', () => {
    expect(expireSignIn(NO_SIGN_IN)).toEqual(NO_SIGN_IN);
  });
});
