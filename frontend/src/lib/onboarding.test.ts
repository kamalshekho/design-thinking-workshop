import { describe, expect, it } from 'vitest';

import { extractOnboardingToken } from './onboarding';

describe('extractOnboardingToken', () => {
  it('returns the decoded token for an onboarding path', () => {
    expect(extractOnboardingToken('/onboarding/abc-123')).toBe('abc-123');
    expect(extractOnboardingToken('/onboarding/abc%20123/')).toBe('abc 123');
  });

  it('returns null for other paths or malformed percent encoding', () => {
    expect(extractOnboardingToken('/')).toBeNull();
    expect(extractOnboardingToken('/onboarding/')).toBeNull();
    expect(extractOnboardingToken('/onboarding/a/b')).toBeNull();
    expect(extractOnboardingToken('/onboarding/%E0%A4%A')).toBeNull();
  });
});
