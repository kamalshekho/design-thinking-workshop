/**
 * Renders the whole application against the stubbed backend.
 *
 * The cache is built per render with `retry: false` and `gcTime: 0`: a retry
 * would make a failing test slow rather than red, and a cache that outlives
 * the render would carry one test's list into the next.
 */

import { QueryClient } from '@tanstack/react-query';
import type { RenderResult } from '@testing-library/react';
import { render, waitFor } from '@testing-library/react';
import { expect } from 'vitest';

import { App } from '@/app/App';
import { de } from '@/content/de';

import { REFERENCE_DATE } from './stubApi';

export function testQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: Infinity,
        refetchOnWindowFocus: false,
      },
      mutations: { retry: false },
    },
  });
}

export function renderApp(): RenderResult {
  return render(<App now={REFERENCE_DATE} client={testQueryClient()} />);
}

/**
 * Renders and waits until the dashboard is past both gates — the Sign-in
 * `GET /me` asks about, and the four requests `DashboardGate` waits for.
 * Every test about a screen starts here rather than filling the sign-in form
 * first; the form itself is tested in `features/auth/LoginScreen.test.tsx`,
 * and once in `App.test.tsx`'s `signs out`.
 */
export async function renderSignedIn(): Promise<RenderResult> {
  const result = renderApp();

  await waitFor(() => {
    expect(
      result.getByRole('navigation', { name: de.navigation.label }),
    ).toBeInTheDocument();
  });

  await waitFor(() => {
    expect(result.queryByText(de.dashboard.loading)).not.toBeInTheDocument();
  });

  return result;
}
