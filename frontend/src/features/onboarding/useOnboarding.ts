import { useEffect, useState } from 'react';

import type { OnboardingStepId } from '../../lib/onboarding';
import {
  fetchOnboarding,
  type OnboardingApiResult,
  type OnboardingData,
  updateOnboardingStep,
} from './api';

type OnboardingPageState =
  | { status: 'loading' }
  | { status: 'ready'; data: OnboardingData }
  | { status: 'not-found' }
  | { status: 'failed' };

function toPageState(result: OnboardingApiResult): OnboardingPageState {
  if (result.status === 'success') {
    return { status: 'ready', data: result.data };
  }

  return { status: result.status };
}

function updateStepInState(
  current: OnboardingPageState,
  stepId: OnboardingStepId,
  done: boolean,
): OnboardingPageState {
  if (current.status !== 'ready') return current;

  return {
    status: 'ready',
    data: {
      ...current.data,
      steps: current.data.steps.map((step) =>
        step.id === stepId ? { ...step, done } : step,
      ),
    },
  };
}

export function useOnboarding(token: string) {
  const [pageState, setPageState] = useState<OnboardingPageState>({
    status: 'loading',
  });

  const [saveFailed, setSaveFailed] = useState(false);

  const [savingStepIds, setSavingStepIds] = useState<
    ReadonlySet<OnboardingStepId>
  >(() => new Set());

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setPageState({ status: 'loading' });

      const result = await fetchOnboarding(token, controller.signal);

      if (controller.signal.aborted) return;

      setPageState(toPageState(result));
    }

    void load();

    return () => {
      controller.abort();
    };
  }, [token]);

  async function toggleStep(stepId: OnboardingStepId, nextDone: boolean) {
    setSaveFailed(false);
    setSavingStepIds((current) => new Set(current).add(stepId));
    setPageState((current) => updateStepInState(current, stepId, nextDone));

    const result = await updateOnboardingStep(token, stepId, nextDone);

    setSavingStepIds((current) => {
      const next = new Set(current);
      next.delete(stepId);

      return next;
    });

    if (result.status === 'failed') {
      setPageState((current) => updateStepInState(current, stepId, !nextDone));
      setSaveFailed(true);

      return;
    }

    if (result.status === 'not-found') {
      setPageState({ status: 'not-found' });

      return;
    }

    const confirmed = result.data.steps.find((step) => step.id === stepId);

    if (confirmed !== undefined) {
      setPageState((current) =>
        updateStepInState(current, stepId, confirmed.done),
      );
    }
  }

  return { pageState, saveFailed, savingStepIds, toggleStep };
}
