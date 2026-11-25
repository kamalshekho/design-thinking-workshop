import { z } from 'zod';

import {
  getJson,
  type JsonRequestResult,
  putJson,
  requestJson,
} from '../../lib/http';
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

export type OnboardingApiResult = JsonRequestResult<OnboardingData>;

const onboardingResponseSchema = z.object({
  name: z.string().min(1),
  steps: z.array(
    z.object({
      id: z.enum(ONBOARDING_STEP_IDS),
      done: z.boolean(),
    }),
  ),
});

export function fetchOnboarding(
  token: string,
  signal?: AbortSignal,
): Promise<OnboardingApiResult> {
  return requestJson(
    () =>
      getJson(`${BASE_URL}/api/onboarding/${encodeURIComponent(token)}`, {
        signal,
      }),
    onboardingResponseSchema,
  );
}

export function updateOnboardingStep(
  token: string,
  stepId: OnboardingStepId,
  done: boolean,
): Promise<OnboardingApiResult> {
  return requestJson(
    () =>
      putJson(
        `${BASE_URL}/api/onboarding/${encodeURIComponent(token)}/steps/${encodeURIComponent(stepId)}`,
        { done },
      ),
    onboardingResponseSchema,
  );
}
