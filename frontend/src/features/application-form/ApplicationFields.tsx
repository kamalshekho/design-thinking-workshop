import { useId } from 'react';
import type { FieldError, UseFormRegister } from 'react-hook-form';

import { Button } from '../../components/ui/Button/Button';
import { Checkbox } from '../../components/ui/Checkbox/Checkbox';
import { Field } from '../../components/ui/Field/Field';
import { Input } from '../../components/ui/Input/Input';
import { Select } from '../../components/ui/Select/Select';
import { Textarea } from '../../components/ui/Textarea/Textarea';
import { de } from '../../content/de';
import { links } from '../../content/links';
import styles from './ApplicationForm.module.css';
import { type makeFieldProps, toErrorText } from './fieldProps';
import { WEEKLY_TIME_OPTIONS } from './routes';
import type { FormValues } from './schema';

interface ApplicationFieldsProps {
  fieldProps: ReturnType<typeof makeFieldProps>;
  register: UseFormRegister<FormValues>;
  consentError: FieldError | undefined;
  isSubmitting: boolean;
  submitError: string | null;
}

export function ApplicationFields({
  fieldProps,
  register,
  consentError,
  isSubmitting,
  submitError,
}: ApplicationFieldsProps) {
  const consentErrorId = useId();
  const { error: nameError, ...nameControl } = fieldProps('name');
  const { error: emailError, ...emailControl } = fieldProps('email');
  const { error: weeklyTimeError, ...weeklyTimeControl } =
    fieldProps('weeklyTime');
  const { error: aboutError, ...aboutControl } = fieldProps('about');

  return (
    <div className={styles.applicationFields}>
      <Field error={nameError} label={de.fields.name.label} required>
        {(aria) => <Input required {...nameControl} {...aria} />}
      </Field>

      <Field error={emailError} label={de.fields.email.label} required>
        {(aria) => <Input required type="email" {...emailControl} {...aria} />}
      </Field>

      <Field
        error={weeklyTimeError}
        label={de.fields.weeklyTime.label}
        required
      >
        {(aria) => (
          <Select defaultValue="" required {...weeklyTimeControl} {...aria}>
            <option disabled value="">
              {de.fields.weeklyTime.placeholder}
            </option>
            {WEEKLY_TIME_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {de.weeklyTimeLabels[option]}
              </option>
            ))}
          </Select>
        )}
      </Field>

      <Field
        error={aboutError}
        hint={de.fields.about.hint}
        label={de.fields.about.label}
      >
        {(aria) => (
          <Textarea
            placeholder={de.fields.about.placeholder}
            {...aboutControl}
            {...aria}
          />
        )}
      </Field>

      <div className={styles.consentGroup}>
        <Checkbox
          aria-describedby={consentError ? consentErrorId : undefined}
          aria-invalid={consentError ? 'true' : undefined}
          {...register('privacyConsent')}
        >
          {de.fields.consent.before}
          <a href={links.privacyPolicy}>{de.fields.consent.linkLabel}</a>
          {de.fields.consent.after}
        </Checkbox>
        {consentError ? (
          <p className={styles.error} id={consentErrorId} role="alert">
            {toErrorText(consentError.message)}
          </p>
        ) : null}
      </div>

      <div className={styles.honeypot}>
        <label htmlFor="website">{de.a11y.honeypotLabel}</label>
        <input
          autoComplete="off"
          id="website"
          tabIndex={-1}
          type="text"
          {...register('website')}
        />
      </div>

      <div className={styles.submitRow}>
        <Button
          isLoading={isSubmitting}
          loadingLabel={de.submit.loadingLabel}
          type="submit"
          width="full"
        >
          {de.submit.label}
        </Button>
        <p className={styles.submitHelper}>{de.submit.helper}</p>
        {isSubmitting ? (
          <p className={styles.visuallyHidden} role="status">
            {de.a11y.submitting}
          </p>
        ) : null}
        {submitError ? (
          <p className={styles.error} role="alert">
            {submitError}
          </p>
        ) : null}
      </div>
    </div>
  );
}
