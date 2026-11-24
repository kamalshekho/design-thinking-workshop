import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ApiProblem } from '@/api/problem';

import { useSignInFailure } from './session';

function signInFailure(...errors: unknown[]) {
  return renderHook(() => useSignInFailure(...errors)).result.current;
}

describe('useSignInFailure', () => {
  it('carries the code of a problem the backend answered with', () => {
    expect(
      signInFailure(
        new ApiProblem({ status: 401, code: 'INVALID_CREDENTIALS' }),
      ),
    ).toEqual({ code: 'INVALID_CREDENTIALS' });
  });

  /**
   * A request the network never delivered has no code, and the form still
   * has to say that something went wrong.
   */
  it('reports a failure without a code when the request never arrived', () => {
    expect(signInFailure(new TypeError('Failed to fetch'))).toEqual({
      code: undefined,
    });
    expect(signInFailure(new Error('boom'))).toEqual({ code: undefined });
  });

  it('reports nothing when neither request failed', () => {
    expect(signInFailure(null, null)).toBeNull();
    expect(signInFailure(undefined)).toBeNull();
    expect(signInFailure()).toBeNull();
  });

  it('prefers the sign-in error over the error of the Sign-in query', () => {
    expect(
      signInFailure(
        new ApiProblem({ status: 429, code: 'RATE_LIMITED' }),
        new ApiProblem({ status: 500, code: 'INTERNAL' }),
      ),
    ).toEqual({ code: 'RATE_LIMITED' });
  });

  it('falls back to the Sign-in query error when signing in did not fail', () => {
    expect(
      signInFailure(null, new ApiProblem({ status: 503, code: 'UNAVAILABLE' })),
    ).toEqual({ code: 'UNAVAILABLE' });
  });
});
