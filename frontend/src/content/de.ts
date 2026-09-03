import type { ErrorCode } from '../features/application-form/errors';
import type { Route, WeeklyTime } from '../features/application-form/routes';

/**
 * Every German string the applicant can read. Nothing outside this file may
 * hold applicant-facing copy — that is what makes the copy reviewable against
 * DESIGN.md in one place.
 *
 * Wording marked "DESIGN.md" is specified and must not be edited without
 * editing DESIGN.md in the same commit (section 49). Wording marked "not yet
 * in DESIGN.md" was written for this implementation and still needs a copy
 * review.
 */
export const de = {
  /** DESIGN.md section 12 */
  nav: {
    items: [
      'Über uns',
      'Engagement',
      'Bildung',
      'Neuigkeiten',
      'Veranstaltungen',
    ],
    donate: 'Spende',
    menuLabel: 'Menü öffnen',
    searchLabel: 'Suche',
    logoAlt: 'ichbinhier e.V.',
  },

  /** DESIGN.md section 15 */
  page: {
    title: 'ichbinhier lebt vom Mitmachen.',
    subtitle:
      'Sag uns in zwei Minuten, wie du dabei sein möchtest. Deine Bestätigung mit allen weiteren Infos kommt sofort per E-Mail — kein „wir melden uns“.',
  },

  /** DESIGN.md section 17 */
  routeField: {
    label: 'Wie möchtest du uns helfen?',
    placeholder: 'Bitte wählen …',
    hint: 'Danach zeigen wir dir nur, was für deinen Weg wirklich nötig ist.',
  },

  /** DESIGN.md section 17 — order comes from ROUTES, not from this object */
  routeLabels: {
    COMMUNITY: 'Bei #ichbinhier mitmachen (Aktionsgruppe)',
    SOCIAL_MEDIA: 'Social Media',
    EDITORIAL: 'Redaktion / Öffentlichkeitsarbeit',
    LEGAL_SUPPORT: 'Rechtliche Unterstützung',
    SUPPORTING_MEMBER: 'Fördermitglied werden',
    OTHER: 'Etwas anderes',
  } satisfies Record<Route, string>,

  /** DESIGN.md sections 19 to 23 */
  fields: {
    name: {
      label: 'Name',
    },
    email: {
      label: 'E-Mail',
    },
    weeklyTime: {
      label: 'Zeit pro Woche',
      placeholder: 'Bitte wählen …',
    },
    about: {
      label: 'Erzähl uns kurz von dir',
      placeholder: 'Was bringst du mit, und was motiviert dich?',
      hint: 'Vier Sätze reichen. Wir lesen jede Bewerbung.',
    },
    consent: {
      /** Split so the link is a real anchor rather than parsed out of a string */
      before:
        'Ich bin damit einverstanden, dass ichbinhier e.V. meine Angaben zur Bearbeitung meiner Bewerbung speichert. ',
      linkLabel: 'Datenschutzerklärung',
      after: '',
    },
  },

  /** DESIGN.md section 21 */
  weeklyTimeLabels: {
    HOURS_1_2: '1–2 Stunden',
    HOURS_3_5: '3–5 Stunden',
    HOURS_5_PLUS: 'mehr als 5 Stunden',
    IRREGULAR: 'unregelmäßig, projektweise',
  } satisfies Record<WeeklyTime, string>,

  /** DESIGN.md sections 24 and 33 */
  submit: {
    label: 'Bewerbung abschicken',
    loadingLabel: 'Wird abgeschickt …',
    helper:
      'Du erhältst sofort eine Bestätigungs-E-Mail mit allen weiteren Infos.',
  },

  /** DESIGN.md section 28 */
  communityPanel: {
    title: 'Du bist sofort dabei.',
    body: 'Kein Warten und keine Rückmeldung nötig: Tritt der Aktionsgruppe bei, lies die Regeln und wähle deinen ersten Thread. Beim ersten Mal antwortest du gemeinsam mit anderen, nie allein.',
    cta: 'Zur Aktionsgruppe →',
  },

  /** DESIGN.md section 35 */
  supportingMemberPanel: {
    title: 'Du unterstützt uns direkt.',
    body: 'Ohne Bewerbung und ohne Wartezeit: Wenn du Fördermitglied werden möchtest, findest du hier alle Informationen und den kurzen Antrag. So hilfst du, digitale Zivilcourage langfristig möglich zu machen.',
    cta: 'Zum Fördermitgliedsantrag →',
  },

  /** DESIGN.md section 30 */
  confirmation: {
    title: 'Deine Bewerbung ist da!',
    bodyBefore:
      'Wir haben deine Angaben erhalten. Eine Bestätigungs-E-Mail mit allen weiteren Infos ist bereits unterwegs an ',
    bodyAfter: '.',
    closing: 'Vielen Dank für dein Interesse!',
  },

  /**
   * Field errors. Only EMAIL_REQUIRED and EMAIL_INVALID are specified
   * (DESIGN.md section 20); the rest are not yet in DESIGN.md and need a copy
   * review. Each one names what to do, never just that something is wrong
   * (section 32 forbids relying on colour alone).
   */
  errors: {
    ROUTE_REQUIRED: 'Bitte wähle aus, wie du uns helfen möchtest',
    CATEGORY_REQUIRED: 'Bitte wähle aus, wie du uns helfen möchtest',
    CATEGORY_UNKNOWN:
      'Diese Auswahl kennen wir nicht — bitte wähle einen der Punkte aus der Liste',
    NAME_REQUIRED: 'Bitte sag uns, wie wir dich ansprechen sollen',
    NAME_TOO_LONG: 'Bitte kürze deinen Namen auf 120 Zeichen',
    EMAIL_REQUIRED:
      'Bitte gib eine E-Mail-Adresse ein, an die wir dir antworten können',
    EMAIL_INVALID:
      'Bitte gib eine E-Mail-Adresse ein, an die wir dir antworten können',
    EMAIL_TOO_LONG:
      'Diese E-Mail-Adresse ist zu lang — bitte prüfe sie noch einmal',
    WEEKLY_TIME_REQUIRED:
      'Bitte wähle aus, wie viel Zeit du pro Woche einbringen kannst',
    WEEKLY_TIME_UNKNOWN:
      'Diese Auswahl kennen wir nicht — bitte wähle einen der Punkte aus der Liste',
    ABOUT_TOO_LONG: 'Bitte kürze deinen Text auf 2000 Zeichen',
    CONSENT_REQUIRED:
      'Ohne deine Einwilligung können wir deine Bewerbung nicht speichern',
    RATE_LIMITED:
      'Es kamen gerade sehr viele Bewerbungen an. Bitte versuche es in einer Minute noch einmal — deine Angaben bleiben stehen.',
    INTERNAL_ERROR:
      'Das Abschicken hat gerade nicht funktioniert. Bitte versuche es noch einmal — deine Angaben bleiben stehen.',
  } satisfies Record<ErrorCode, string>,

  /** Shown for any error code the frontend does not know (see API.md) */
  unknownError:
    'Das Abschicken hat gerade nicht funktioniert. Bitte versuche es noch einmal — deine Angaben bleiben stehen.',

  a11y: {
    /** Announced when the reveal or the confirmation replaces content */
    submitting: 'Deine Bewerbung wird abgeschickt.',
    honeypotLabel: 'Dieses Feld bitte leer lassen',
  },
} as const;

export function errorText(code: string): string {
  return code in de.errors ? de.errors[code as ErrorCode] : de.unknownError;
}
