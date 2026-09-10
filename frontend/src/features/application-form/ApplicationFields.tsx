import { useId } from 'react';
import type { FieldError, UseFormRegister } from 'react-hook-form';

import { Button } from '../../components/ui/Button/Button';
import { Checkbox } from '../../components/ui/Checkbox/Checkbox';
import { Field } from '../../components/ui/Field/Field';
import { Input } from '../../components/ui/Input/Input';
import { Select } from '../../components/ui/Select/Select';
import { Textarea } from '../../components/ui/Textarea/Textarea';
import { links } from '../../content/links';
import type { Content } from '../../content/types';
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
  content: Content;
}

export function ApplicationFields({
  fieldProps,
  register,
  consentError,
  isSubmitting,
  submitError,
  content,
}: ApplicationFieldsProps) {
  const consentErrorId = useId();
  const { error: nameError, ...nameControl } = fieldProps('name');
  const { error: emailError, ...emailControl } = fieldProps('email');
  const { error: weeklyTimeError, ...weeklyTimeControl } =
    fieldProps('weeklyTime');
  const { error: aboutError, ...aboutControl } = fieldProps('about');

  return (
    <div className={styles.applicationFields}>
      <Field error={nameError} label={content.fields.name.label} required>
        {(aria) => <Input required {...nameControl} {...aria} />}
      </Field>

      <Field error={emailError} label={content.fields.email.label} required>
        {(aria) => <Input required type="email" {...emailControl} {...aria} />}
      </Field>

      <Field
        error={weeklyTimeError}
        label={content.fields.weeklyTime.label}
        required
      >
        {(aria) => (
          <Select defaultValue="" required {...weeklyTimeControl} {...aria}>
            <option disabled value="">
              {content.fields.weeklyTime.placeholder}
            </option>
            {WEEKLY_TIME_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {content.weeklyTimeLabels[option]}
              </option>
            ))}
          </Select>
        )}
      </Field>

      <Field
        error={aboutError}
        hint={content.fields.about.hint}
        label={content.fields.about.label}
      >
        {(aria) => (
          <Textarea
            placeholder={content.fields.about.placeholder}
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
          {content.fields.consent.before}
          <a href={links.privacyPolicy}>{content.fields.consent.linkLabel}</a>
          {content.fields.consent.after}
        </Checkbox>
        {consentError ? (
          <p className={styles.error} id={consentErrorId} role="alert">
            {toErrorText(consentError.message, content)}
          </p>
        ) : null}
      </div>

      <div className={styles.honeypot}>
        <label htmlFor="website">{content.a11y.honeypotLabel}</label>
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
          loadingLabel={content.submit.loadingLabel}
          type="submit"
          width="full"
        >
          {content.submit.label}
        </Button>
        <p className={styles.submitHelper}>{content.submit.helper}</p>
        {isSubmitting ? (
          <p className={styles.visuallyHidden} role="status">
            {content.a11y.submitting}
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
