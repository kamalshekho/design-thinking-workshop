import { useRef, useState } from 'react';
import type { UseFormSetError, UseFormSetValue } from 'react-hook-form';

import { errorText } from '../../content/de';
import { type Category, submitApplication } from './api';
import { formFieldFor } from './errors';
import { asApplicationValues, type FormValues } from './schema';

/**
 * Submits the application: calls the API, maps server field errors back onto
 * the form, and tracks the in-flight/failure state the submit row shows.
 *
 * `categoriesById` is the currently loaded category list. A route that is not
 * in it is caught here, before any network call, the same way the backend
 * would reject it with `CATEGORY_UNKNOWN` — the list can go stale between
 * page load and submit, so this is a courtesy, not a replacement for the
 * server check.
 */
export function useApplicationSubmit(
  setError: UseFormSetError<FormValues>,
  setValue: UseFormSetValue<FormValues>,
  categoriesById: Map<string, Category>,
  retryCategories: () => void,
) {
  const submissionId = useRef(crypto.randomUUID());
  // A ref, not `isSubmitting` state: state only updates on the next render,
  // but this is checked synchronously at the top of `onSubmit`, before that
  // render happens — the ref is what makes the double-submit guard hold even
  // for two clicks that land back-to-back.
  const isSubmittingRef = useRef(false);
  const [confirmedEmail, setConfirmedEmail] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function onSubmit(values: FormValues) {
    if (isSubmittingRef.current) return;

    const applicationValues = asApplicationValues(values);
    if (!applicationValues) return;

    if (!categoriesById.has(applicationValues.route)) {
      setError('route', { message: 'CATEGORY_UNKNOWN', type: 'validate' });
      return;
    }

    isSubmittingRef.current = true;
    setSubmitError(null);
    setIsSubmitting(true);
    const result = await submitApplication(
      applicationValues,
      submissionId.current,
    );
    isSubmittingRef.current = false;
    setIsSubmitting(false);

    if (result.status === 'success') {
      setConfirmedEmail(applicationValues.email);
      return;
    }

    if (result.status === 'field-errors') {
      for (const fieldError of result.errors) {
        const formField = formFieldFor(fieldError.field);
        if (!formField) continue;
        setError(formField, { message: fieldError.code, type: 'server' });

        // The category the applicant picked was deactivated between page
        // load and submit. Their other answers stay; only the choice they
        // can no longer act on is cleared, against a freshly reloaded list.
        if (fieldError.code === 'CATEGORY_UNAVAILABLE') {
          setValue('route', '');
          retryCategories();
        }
      }
      return;
    }

    setSubmitError(errorText(result.code));
  }

  return { onSubmit, confirmedEmail, isSubmitting, submitError };
}
