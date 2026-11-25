import { z } from 'zod';

import { getJson, putJson } from '../../lib/http';
import {
  ONBOARDING_STEP_IDS,
  type OnboardingStepId,
} from '../../lib/onboarding';

z.config({ jitless: true });

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

interface OnboardingStepState {
  id: OnboardingStepId;
  done: boolean;
}

export interface OnboardingData {
  name: string;
  steps: OnboardingStepState[];
}

export type OnboardingApiResult =
  | { status: 'success'; data: OnboardingData }
  | { status: 'not-found' }
  | { status: 'failed' };

const onboardingResponseSchema = z.object({
  name: z.string().min(1),
  steps: z.array(
    z.object({
      id: z.enum(ONBOARDING_STEP_IDS),
      done: z.boolean(),
    }),
  ),
});

async function runOnboardingRequest(
  send: () => Promise<Response>,
): Promise<OnboardingApiResult> {
  let response: Response;

  try {
    response = await send();
  } catch {
    return { status: 'failed' };
  }

  if (response.status === 404) return { status: 'not-found' };

  if (!response.ok) return { status: 'failed' };

  try {
    const body: unknown = await response.json();
    const parsed = onboardingResponseSchema.safeParse(body);

    return parsed.success
      ? { status: 'success', data: parsed.data }
      : { status: 'failed' };
  } catch {
    return { status: 'failed' };
  }
}

export function fetchOnboarding(
  token: string,
  signal?: AbortSignal,
): Promise<OnboardingApiResult> {
  return runOnboardingRequest(() =>
    getJson(`${BASE_URL}/api/onboarding/${encodeURIComponent(token)}`, {
      signal,
    }),
  );
}

export function updateOnboardingStep(
  token: string,
  stepId: OnboardingStepId,
  done: boolean,
): Promise<OnboardingApiResult> {
  return runOnboardingRequest(() =>
    putJson(
      `${BASE_URL}/api/onboarding/${encodeURIComponent(token)}/steps/${encodeURIComponent(stepId)}`,
      { done },
    ),
  );
}
