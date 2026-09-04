/**
 * External destinations the form links to.
 *
 * None of these is confirmed with the association yet — they are the open
 * questions listed in ../../README.md. A wrong link here is worse than a
 * missing field, because the two bypass routes consist of nothing but their
 * link.
 */
export const links = {
  home: 'https://www.ichbinhier.eu/',
  /** DESIGN.md section 23 — needs the real privacy policy URL */
  privacyPolicy: 'https://www.ichbinhier.eu/datenschutz/',
  /** DESIGN.md section 28 — where a community member actually joins */
  communityGroup: 'https://www.ichbinhier.eu/engagement/',
  /** DESIGN.md section 35 — the supporting membership application */
  supportingMembership: 'https://www.ichbinhier.eu/spende/',
  /** DESIGN.md section 12 — header navigation, confirmed against the live site */
  nav: {
    about: 'https://www.ichbinhier.eu/ichbinhier/verein',
    engagement: 'https://www.ichbinhier.eu/engagement/',
    education: 'https://www.ichbinhier.eu/bildung/',
    news: 'https://www.ichbinhier.eu/neuigkeiten/',
    events: 'https://www.ichbinhier.eu/veranstaltungen/',
    donate: 'https://www.ichbinhier.eu/engagement/spende',
  },
  /** Section 11 footer — none of these is confirmed with the association yet */
  footer: {
    talkToUs: 'https://www.ichbinhier.eu/kontakt/',
    impressum: 'https://www.ichbinhier.eu/impressum/',
    donate: 'https://www.ichbinhier.eu/engagement/spende',
    social: {
      facebook: 'https://www.facebook.com/ichbinhier',
      instagram: 'https://www.instagram.com/ichbinhier.online',
      linkedin: 'https://www.linkedin.com/company/ichbinhier',
      bluesky: 'https://bsky.app/profile/ichbinhier.online',
      tiktok: 'https://www.tiktok.com/@ichbinhier',
    },
  },
} as const;
