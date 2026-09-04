import { zodResolver } from '@hookform/resolvers/zod';
import { type SubmitEvent, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import iconSpeak from '../../assets/icons/icon_speak.png';
import { Button } from '../../components/ui/Button/Button';
import { Field } from '../../components/ui/Field/Field';
import { FormCard } from '../../components/ui/FormCard/FormCard';
import { RoutePanel } from '../../components/ui/RoutePanel/RoutePanel';
import { Select } from '../../components/ui/Select/Select';
import { de } from '../../content/de';
import { links } from '../../content/links';
import { ApplicationFields } from './ApplicationFields';
import styles from './ApplicationForm.module.css';
import { Confirmation } from './Confirmation';
import { makeFieldProps } from './fieldProps';
import { outcomeOf } from './routes';
import { emptyFormValues, formSchema, type FormValues } from './schema';
import { useApplicationSubmit } from './useApplicationSubmit';
import { useCategories } from './useCategories';
import { useRouteAnalytics } from './useRouteAnalytics';

/**
 * The applicant form, ported from Figma states 01–06 and 08 (DESIGN.md
 * sections 27–35 and 45): the initial route selector, the two direct-route
 * panels, the Vereinsarbeit fields, validation errors, the loading submit and
 * the confirmation view. State 07 (mobile 375px) is the same markup under the
 * responsive rules in ApplicationForm.module.css, not a separate branch.
 */
export function ApplicationForm() {
  const {
    control,
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: emptyFormValues,
    resolver: zodResolver(formSchema),
  });

  const categoriesState = useCategories();
  const categoriesById = useMemo(
    () =>
      new Map(
        categoriesState.categories.map((category) => [category.id, category]),
      ),
    [categoriesState.categories],
  );

  const route = useWatch({ control, name: 'route' });
  const outcome = route === '' ? null : outcomeOf(route);

  useRouteAnalytics(route);
  const { onSubmit, confirmedEmail, isSubmitting, submitError } =
    useApplicationSubmit(
      setError,
      setValue,
      categoriesById,
      categoriesState.retry,
    );

  function handleFormSubmit(event: SubmitEvent<HTMLFormElement>) {
    void handleSubmit(onSubmit)(event);
  }

  if (confirmedEmail) {
    return <Confirmation email={confirmedEmail} />;
  }

  const fieldProps = makeFieldProps(register, errors);
  const { error: routeError, ...routeControl } = fieldProps('route');

  return (
    <FormCard>
      <h1 className={styles.title}>{de.page.title}</h1>
      <p className={styles.subtitle}>{de.page.subtitle}</p>
      <img alt="" className={styles.icon} src={iconSpeak} />
      <hr className={styles.divider} />
      <form noValidate onSubmit={handleFormSubmit}>
        <div className={styles.fields}>
          <Field
            error={routeError}
            hint={de.routeField.hint}
            label={de.routeField.label}
            required
          >
            {(aria) => (
              <Select
                defaultValue=""
                disabled={categoriesState.status !== 'loaded'}
                required
                {...routeControl}
                {...aria}
              >
                {categoriesState.status === 'loading' ? (
                  <option disabled value="">
                    {de.categoriesField.loadingOption}
                  </option>
                ) : null}
                {categoriesState.status === 'error' ? (
                  <option disabled value="">
                    {de.categoriesField.errorOption}
                  </option>
                ) : null}
                {categoriesState.status === 'loaded' ? (
                  <>
                    <option disabled value="">
                      {de.routeField.placeholder}
                    </option>
                    <option value="COMMUNITY">
                      {de.routeLabels.COMMUNITY}
                    </option>
                    {categoriesState.categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.label}
                      </option>
                    ))}
                    <option value="SUPPORTING_MEMBER">
                      {de.routeLabels.SUPPORTING_MEMBER}
                    </option>
                  </>
                ) : null}
              </Select>
            )}
          </Field>

          {categoriesState.status === 'error' ? (
            <div className={styles.categoriesError}>
              <p className={styles.error} role="alert">
                {de.categoriesField.error}
              </p>
              <Button
                onClick={categoriesState.retry}
                type="button"
                variant="secondary"
              >
                {de.categoriesField.retry}
              </Button>
            </div>
          ) : null}

          {categoriesState.status === 'loaded' &&
          categoriesState.categories.length === 0 ? (
            <p className={styles.categoriesEmpty}>{de.categoriesField.empty}</p>
          ) : null}

          {outcome === 'community' ? (
            <RoutePanel
              actionHref={links.communityGroup}
              actionLabel={de.communityPanel.cta}
              body={de.communityPanel.body}
              title={de.communityPanel.title}
              variant="community"
            />
          ) : null}

          {outcome === 'supporting-member' ? (
            <RoutePanel
              actionHref={links.supportingMembership}
              actionLabel={de.supportingMemberPanel.cta}
              body={de.supportingMemberPanel.body}
              title={de.supportingMemberPanel.title}
              variant="supporting-member"
            />
          ) : null}

          {outcome === 'application' ? (
            <ApplicationFields
              consentError={errors.privacyConsent}
              fieldProps={fieldProps}
              isSubmitting={isSubmitting}
              register={register}
              submitError={submitError}
            />
          ) : null}
        </div>
      </form>
    </FormCard>
  );
}
