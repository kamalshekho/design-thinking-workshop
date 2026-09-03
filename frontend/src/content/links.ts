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
} as const;
