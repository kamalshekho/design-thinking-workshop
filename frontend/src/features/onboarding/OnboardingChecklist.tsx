import { FormCard } from '../../components/ui/FormCard/FormCard';
import tapTargetStyles from '../../components/ui/tapTarget.module.css';
import { de as content } from '../../content/de';
import { links } from '../../content/links';
import { cx } from '../../lib/cx';
import type { OnboardingStepId } from '../../lib/onboarding';
import styles from './OnboardingChecklist.module.css';
import { useOnboarding } from './useOnboarding';

interface OnboardingChecklistProps {
  token: string;
}

const STEP_LINKS: Partial<Record<OnboardingStepId, string>> = {
  COMMUNITY_GROUP: links.onboardingFacebookGroup,
  DIGITAL_DEMOCRACY_LAB: links.onboardingDemocracyLab,
  CONTACT: links.onboardingContact,
};

export function OnboardingChecklist({ token }: OnboardingChecklistProps) {
  const { pageState, saveFailed, savingStepIds, toggleStep } =
    useOnboarding(token);

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

        {saveFailed ? (
          <p className={styles.alert} role="alert">
            {content.onboarding.saveError}
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
                    void toggleStep(step.id, event.target.checked);
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
