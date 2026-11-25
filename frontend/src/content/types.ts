import type { ErrorCode } from '../lib/errorCodes';
import type { OnboardingStepId } from '../lib/onboarding';
import type { FixedRoute, WeeklyTime } from '../lib/routes';

export interface Content {
  nav: {
    items: readonly [string, string, string, string, string];
    donate: string;
    menuLabel: string;
    menuCloseLabel: string;
    searchLabel: string;
    logoAlt: string;
  };
  hero: { tagline: string };
  page: { title: string; subtitle: string };
  routeField: { label: string; placeholder: string; hint: string };
  routeLabels: Record<FixedRoute, string>;
  categoriesField: {
    loadingOption: string;
    errorOption: string;
    error: string;
    retry: string;
    empty: string;
  };
  fields: {
    name: { label: string };
    email: { label: string };
    weeklyTime: { label: string; placeholder: string };
    about: { label: string; placeholder: string; hint: string };
    consent: { before: string; linkLabel: string; after: string };
  };
  weeklyTimeLabels: Record<WeeklyTime, string>;
  submit: { label: string; loadingLabel: string; helper: string };
  actions: { next: string };
  communityPanel: { title: string; body: string; cta: string };
  supportingMemberPanel: { title: string; body: string; cta: string };
  confirmation: {
    title: string;
    bodyBefore: string;
    bodyAfter: string;
    closing: string;
  };
  errors: Record<ErrorCode, string>;
  unknownError: string;
  a11y: { submitting: string; honeypotLabel: string };
  onboarding: {
    loading: string;
    invalidTitle: string;
    invalidBody: string;
    loadError: string;
    saveError: string;
    heading: (name: string) => string;
    intro: string;
    rulesHeading: string;
    rules: readonly [string, string, string, string];
    checklistHeading: string;
    progress: (done: number, total: number) => string;
    steps: Record<
      OnboardingStepId,
      {
        label: string;
        description: string;
        linkLabel?: string;
      }
    >;
  };
  footer: {
    contact: { title: string; talkToUs: string; address: readonly string[] };
    legal: { title: string; imprint: string; privacy: string };
    donateLabel: string;
    copyright: (year: number) => string;
    backToTopLabel: string;
  };
}
