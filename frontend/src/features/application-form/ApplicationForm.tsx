import { zodResolver } from '@hookform/resolvers/zod';
import { type SubmitEvent, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import iconSpeak from '../../assets/icons/icon_speak.png';
import { Button } from '../../components/ui/Button/Button';
import { Field } from '../../components/ui/Field/Field';
import { FormCard } from '../../components/ui/FormCard/FormCard';
import { RoutePanel } from '../../components/ui/RoutePanel/RoutePanel';
import { Select } from '../../components/ui/Select/Select';
import { links } from '../../content/links';
import { useLocale } from '../../content/useLocale';
import { ApplicationFields } from './ApplicationFields';
import styles from './ApplicationForm.module.css';
import { Confirmation } from './Confirmation';
import { makeFieldProps, toErrorText } from './fieldProps';
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
  const { content } = useLocale();
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
  const { onSubmit, confirmedEmail, isSubmitting, submitErrorCode } =
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
    return <Confirmation content={content} email={confirmedEmail} />;
  }

  const fieldProps = makeFieldProps(register, errors, content);
  const submitError =
    toErrorText(submitErrorCode ?? undefined, content) ?? null;
  const { error: routeError, ...routeControl } = fieldProps('route');

  return (
    <FormCard>
      <h1 className={styles.title}>{content.page.title}</h1>
      <p className={styles.subtitle}>{content.page.subtitle}</p>
      <img alt="" className={styles.icon} src={iconSpeak} />
      <hr className={styles.divider} />
      <form noValidate onSubmit={handleFormSubmit}>
        <div className={styles.fields}>
          <Field
            error={routeError}
            hint={content.routeField.hint}
            label={content.routeField.label}
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
                    {content.categoriesField.loadingOption}
                  </option>
                ) : null}
                {categoriesState.status === 'error' ? (
                  <option disabled value="">
                    {content.categoriesField.errorOption}
                  </option>
                ) : null}
                {categoriesState.status === 'loaded' ? (
                  <>
                    <option disabled value="">
                      {content.routeField.placeholder}
                    </option>
                    <option value="COMMUNITY">
                      {content.routeLabels.COMMUNITY}
                    </option>
                    {categoriesState.categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.label}
                      </option>
                    ))}
                    <option value="SUPPORTING_MEMBER">
                      {content.routeLabels.SUPPORTING_MEMBER}
                    </option>
                  </>
                ) : null}
              </Select>
            )}
          </Field>

          {categoriesState.status === 'error' ? (
            <div className={styles.categoriesError}>
              <p className={styles.error} role="alert">
                {content.categoriesField.error}
              </p>
              <Button
                onClick={categoriesState.retry}
                type="button"
                variant="secondary"
              >
                {content.categoriesField.retry}
              </Button>
            </div>
          ) : null}

          {categoriesState.status === 'loaded' &&
          categoriesState.categories.length === 0 ? (
            <p className={styles.categoriesEmpty}>
              {content.categoriesField.empty}
            </p>
          ) : null}

          {outcome === 'community' ? (
            <RoutePanel
              actionHref={links.communityGroup}
              actionLabel={content.communityPanel.cta}
              body={content.communityPanel.body}
              title={content.communityPanel.title}
              variant="community"
            />
          ) : null}

          {outcome === 'supporting-member' ? (
            <RoutePanel
              actionHref={links.supportingMembership}
              actionLabel={content.supportingMemberPanel.cta}
              body={content.supportingMemberPanel.body}
              title={content.supportingMemberPanel.title}
              variant="supporting-member"
            />
          ) : null}

          {outcome === 'application' ? (
            <ApplicationFields
              consentError={errors.privacyConsent}
              content={content}
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
