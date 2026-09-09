/**
 * Renders the whole application against the stubbed backend.
 *
 * The cache is the application's own — `createQueryClient`, so that the
 * cache-level recognition of an expired Sign-in is under test rather than
 * stubbed out — with two defaults overridden per render: `retry: false`,
 * because a retry would make a failing test slow rather than red, and
 * `gcTime: 0`, because a cache that outlives the render would carry one
 * test's list into the next.
 */

import type { QueryClient } from '@tanstack/react-query';
import type { RenderResult } from '@testing-library/react';
import { render, waitFor } from '@testing-library/react';
import { expect } from 'vitest';

import { App } from '@/app/App';
import { de } from '@/content/de';
import { createQueryClient } from '@/queries/queryClient';

import { REFERENCE_DATE } from './stubApi';

export function testQueryClient(): QueryClient {
  const client = createQueryClient();

  client.setDefaultOptions({
    queries: {
      retry: false,
      gcTime: 0,
      staleTime: Infinity,
      refetchOnWindowFocus: false,
    },
    mutations: { retry: false },
  });

  return client;
}

export function renderApp(): RenderResult {
  return render(<App now={REFERENCE_DATE} client={testQueryClient()} />);
}

/**
 * Renders and waits until the dashboard is past both gates — the Sign-in
 * `GET /me` asks about, and the four requests `DashboardGate` waits for.
 * Every test about a screen starts here rather than filling the sign-in form
 * first; the form itself is tested in `features/auth/SignInForm.test.tsx`,
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
