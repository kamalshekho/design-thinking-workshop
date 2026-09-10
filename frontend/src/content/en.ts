import type { Content } from './types';

export const en = {
  nav: {
    items: ['About us', 'Get involved', 'Education', 'News', 'Events'],
    donate: 'Donate',
    menuLabel: 'Open menu',
    menuCloseLabel: 'Close menu',
    searchLabel: 'Search',
    languageLabel: 'Language',
    logoAlt: 'ichbinhier e.V.',
  },
  hero: { tagline: 'ichbinhier, so that love speaks louder' },
  page: {
    title: 'ichbinhier thrives on participation.',
    subtitle:
      'Tell us in two minutes how you would like to get involved. Your confirmation with all further information will arrive straight away by email — no “we will get back to you”.',
  },
  routeField: {
    label: 'How would you like to help?',
    placeholder: 'Please choose …',
    hint: 'We will then show you only what is really needed for your path.',
  },
  routeLabels: {
    COMMUNITY: 'Join #ichbinhier (action group)',
    SUPPORTING_MEMBER: 'Become a supporting member',
  },
  categoriesField: {
    loadingOption: 'Loading …',
    errorOption: 'Unavailable',
    error:
      'The areas for association work could not be loaded. Please try again.',
    retry: 'Try again',
    empty: 'There are currently no open areas for association work.',
  },
  fields: {
    name: { label: 'Name' },
    email: { label: 'Email' },
    weeklyTime: { label: 'Time per week', placeholder: 'Please choose …' },
    about: {
      label: 'Tell us a little about yourself',
      placeholder: 'What can you bring, and what motivates you?',
      hint: 'Four sentences are enough. We read every application.',
    },
    consent: {
      before:
        'I agree that ichbinhier e.V. may store my details to process my application. ',
      linkLabel: 'Privacy policy',
      after: '',
    },
  },
  weeklyTimeLabels: {
    HOURS_1_2: '1–2 hours',
    HOURS_3_5: '3–5 hours',
    HOURS_5_PLUS: 'more than 5 hours',
    IRREGULAR: 'irregularly, project by project',
  },
  submit: {
    label: 'Send application',
    loadingLabel: 'Sending …',
    helper:
      'You will immediately receive a confirmation email with all further information.',
  },
  actions: { next: 'Next' },
  communityPanel: {
    title: 'You can join straight away.',
    body: 'No waiting and no reply required: join the action group, read the rules and choose your first thread. The first time, you reply together with others — never alone.',
    cta: 'Go to the action group',
  },
  supportingMemberPanel: {
    title: 'You support us directly.',
    body: 'No application and no waiting: if you would like to become a supporting member, you will find all the information and the short application here. This is how you help make digital civil courage possible in the long term.',
    cta: 'Go to the supporting-member application',
  },
  confirmation: {
    title: 'Your application has arrived!',
    bodyBefore:
      'We have received your details. A confirmation email with all further information is already on its way to ',
    bodyAfter: '.',
    closing: 'Thank you for your interest!',
  },
  errors: {
    ROUTE_REQUIRED: 'Please choose how you would like to help',
    CATEGORY_REQUIRED: 'Please choose how you would like to help',
    CATEGORY_UNKNOWN:
      'We do not recognise this choice — please choose an item from the list',
    CATEGORY_UNAVAILABLE:
      'This area is no longer available. Please choose another item from the updated list.',
    NAME_REQUIRED: 'Please tell us how we should address you',
    NAME_TOO_LONG: 'Please shorten your name to 120 characters',
    EMAIL_REQUIRED: 'Please enter an email address where we can reach you',
    EMAIL_INVALID: 'Please enter an email address where we can reach you',
    EMAIL_TOO_LONG: 'This email address is too long — please check it again',
    WEEKLY_TIME_REQUIRED:
      'Please choose how much time you can contribute each week',
    WEEKLY_TIME_UNKNOWN:
      'We do not recognise this choice — please choose an item from the list',
    ABOUT_TOO_LONG: 'Please shorten your text to 2000 characters',
    CONSENT_REQUIRED: 'We cannot store your application without your consent',
    RATE_LIMITED:
      'We are receiving many applications right now. Please try again in a minute — your details will remain here.',
    INTERNAL_ERROR:
      'Sending did not work just now. Please try again — your details will remain here.',
  },
  unknownError:
    'Sending did not work just now. Please try again — your details will remain here.',
  a11y: {
    submitting: 'Your application is being sent.',
    honeypotLabel: 'Please leave this field empty',
  },
  footer: {
    kontakt: {
      title: 'Contact',
      talkToUs: 'Talk to us',
      address: ['Postfach 25588', '10129 Berlin', 'info@ichbinhier.online'],
    },
    rechtliches: {
      title: 'Legal notice',
      impressum: 'Legal notice',
      datenschutz: 'Privacy',
    },
    donateLabel: 'DONATE HERE',
    socialLabels: {
      facebook: 'Facebook',
      instagram: 'Instagram',
      linkedin: 'LinkedIn',
      bluesky: 'Bluesky',
      tiktok: 'TikTok',
    },
    copyright: 'Copyright 2026 ichbinhier e.V. – All rights reserved.',
    backToTopLabel: 'Back to top',
  },
} as const satisfies Content;
