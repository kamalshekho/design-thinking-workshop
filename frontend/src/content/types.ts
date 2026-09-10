import type { ErrorCode } from '../features/application-form/errors';
import type {
  FixedRoute,
  WeeklyTime,
} from '../features/application-form/routes';

export type Locale = 'de' | 'en';

export interface Content {
  nav: {
    items: readonly [string, string, string, string, string];
    donate: string;
    menuLabel: string;
    menuCloseLabel: string;
    searchLabel: string;
    languageLabel: string;
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
  footer: {
    kontakt: { title: string; talkToUs: string; address: readonly string[] };
    rechtliches: { title: string; impressum: string; datenschutz: string };
    donateLabel: string;
    socialLabels: {
      facebook: string;
      instagram: string;
      linkedin: string;
      bluesky: string;
      tiktok: string;
    };
    copyright: string;
    backToTopLabel: string;
  };
}
