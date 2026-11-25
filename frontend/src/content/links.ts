/**
 * External destinations the form links to.
 *
 * Only `privacyPolicy` is taken from the live ichbinhier.eu website; the other
 * destinations are not confirmed with the association yet (see Open questions
 * in ../../README.md). A wrong link here is worse than a missing field, because
 * the two bypass routes consist of nothing but their link.
 */
export const links = {
  /**
   * DESIGN.md sections 11a and 23 — linked from the ichbinhier.eu homepage
   * (HTTP 200).
   */
  privacyPolicy: 'https://www.ichbinhier.eu/datenschutz',
  /** DESIGN.md section 28 — where a community member actually joins */
  communityGroup: 'https://www.ichbinhier.eu/engagement/',
  /** DESIGN.md section 35 — the supporting membership application */
  supportingMembership: 'https://www.ichbinhier.eu/spende/',
  /** DESIGN.md section 35a — onboarding steps (`A32`) */
  onboardingFacebookGroup: 'https://www.facebook.com/groups/718574178311688',
  onboardingDemocracyLab:
    'https://www.ichbinhier.eu/bildung/digital-democracy-lab',
  onboardingContact: 'https://www.ichbinhier.eu/kontakt',
} as const;
