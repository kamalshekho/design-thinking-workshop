import { describe, expect, it } from 'vitest';

import { currentStaffMember } from '@/data/currentStaffMember';

import { signIn } from './signIn';

describe('signIn', () => {
  it('signs the known Staff member in with any password', () => {
    const result = signIn(currentStaffMember.email, 'anything');

    expect(result).toEqual({ ok: true, staffMember: currentStaffMember });
  });

  it('ignores case and surrounding whitespace in the address', () => {
    const result = signIn(
      `  ${currentStaffMember.email.toUpperCase()}  `,
      'anything',
    );

    expect(result.ok).toBe(true);
  });

  it('reports an empty address before it looks at the password', () => {
    expect(signIn('   ', '')).toEqual({ ok: false, reason: 'email-required' });
  });

  it('reports an address that is not finished', () => {
    expect(signIn('ashton.blackwell@ichbinhier', 'anything')).toEqual({
      ok: false,
      reason: 'email-invalid',
    });
  });

  it('reports a missing password once the address is usable', () => {
    expect(signIn(currentStaffMember.email, '')).toEqual({
      ok: false,
      reason: 'password-required',
    });
  });

  it('reports an address no Staff member has', () => {
    expect(signIn('someone@example.org', 'anything')).toEqual({
      ok: false,
      reason: 'unknown-account',
    });
  });
});
