import { useEffect, useState } from 'react';

import { FormCard } from '../../components/ui/FormCard/FormCard';
import tapTargetStyles from '../../components/ui/tapTarget.module.css';
import { de as content } from '../../content/de';
import { links } from '../../content/links';
import { cx } from '../../lib/cx';
import type { OnboardingStepId } from '../../lib/onboarding';
import {
  fetchOnboarding,
  type OnboardingApiResult,
  type OnboardingData,
  updateOnboardingStep,
} from './api';
import styles from './OnboardingChecklist.module.css';

interface OnboardingChecklistProps {
  token: string;
}

type PageState =
  | { status: 'loading' }
  | { status: 'ready'; data: OnboardingData }
  | { status: 'not-found' }
  | { status: 'failed' };

function toPageState(result: OnboardingApiResult): PageState {
  if (result.status === 'success') {
    return { status: 'ready', data: result.data };
  }

  return { status: result.status };
}

function updateStepInState(
  current: PageState,
  stepId: OnboardingStepId,
  done: boolean,
): PageState {
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

const STEP_LINKS: Partial<Record<OnboardingStepId, string>> = {
  COMMUNITY_GROUP: links.onboardingFacebookGroup,
  DIGITAL_DEMOCRACY_LAB: links.onboardingDemocracyLab,
  CONTACT: links.onboardingContact,
};

export function OnboardingChecklist({ token }: OnboardingChecklistProps) {
  const [pageState, setPageState] = useState<PageState>({ status: 'loading' });
  const [saveError, setSaveError] = useState<string | null>(null);

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

  async function handleToggle(stepId: OnboardingStepId, nextDone: boolean) {
    setSaveError(null);
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
      setSaveError(content.onboarding.saveError);

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

  if (pageState.status === 'loading') {
    return (
      <FormCard>
        <p className={styles.statusText} role="status">
          {content.onboarding.loading}
        </p>
      </FormCard>
    );
  }

  if (pageState.status === 'not-found') {
    return (
      <FormCard>
        <h1 className={styles.title}>{content.onboarding.invalidTitle}</h1>
        <p className={styles.intro}>{content.onboarding.invalidBody}</p>
      </FormCard>
    );
  }

  if (pageState.status === 'failed') {
    return (
      <FormCard>
        <p className={styles.alert} role="alert">
          {content.onboarding.loadError}
        </p>
      </FormCard>
    );
  }

  const { name, steps } = pageState.data;
  const doneCount = steps.filter((step) => step.done).length;

  return (
    <FormCard>
      <h1 className={styles.title}>{content.onboarding.heading(name)}</h1>
      <p className={styles.intro}>{content.onboarding.intro}</p>

      <section
        aria-labelledby="onboarding-rules-heading"
        className={styles.rulesBox}
      >
        <h2 className={styles.sectionHeading} id="onboarding-rules-heading">
          {content.onboarding.rulesHeading}
        </h2>
        <ul className={styles.rulesList}>
          {content.onboarding.rules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="onboarding-steps-heading">
        <div className={styles.checklistHeader}>
          <h2 className={styles.sectionHeading} id="onboarding-steps-heading">
            {content.onboarding.checklistHeading}
          </h2>
          <p aria-live="polite" className={styles.progress}>
            {content.onboarding.progress(doneCount, steps.length)}
          </p>
        </div>

        {saveError !== null ? (
          <p className={styles.alert} role="alert">
            {saveError}
          </p>
        ) : null}

        <ol className={styles.stepList}>
          {steps.map((step) => {
            const copy = content.onboarding.steps[step.id];
            const href = STEP_LINKS[step.id];
            const checkboxId = `onboarding-step-${step.id}`;

            return (
              <li className={styles.stepItem} key={step.id}>
                <input
                  checked={step.done}
                  className={cx(styles.checkbox, tapTargetStyles.tapTarget)}
                  disabled={savingStepIds.has(step.id)}
                  id={checkboxId}
                  onChange={(event) => {
                    void handleToggle(step.id, event.target.checked);
                  }}
                  type="checkbox"
                />
                <div className={styles.stepBody}>
                  <label className={styles.stepLabel} htmlFor={checkboxId}>
                    {copy.label}
                  </label>
                  <p className={styles.stepDescription}>{copy.description}</p>
                  {href !== undefined && 'linkLabel' in copy ? (
                    <a
                      className={styles.stepLink}
                      href={href}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      {copy.linkLabel}
                    </a>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      </section>
    </FormCard>
  );
}
