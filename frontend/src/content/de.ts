import type { ErrorCode } from '../lib/errorCodes';
import type { OnboardingStepId } from '../lib/onboarding';
import type { FixedRoute, WeeklyTime } from '../lib/routes';
import type { Content } from './types';

/**
 * Every German string the applicant can read. Nothing outside this file may
 * hold applicant-facing copy — that is what makes the copy reviewable against
 * DESIGN.md in one place.
 *
 * Wording here is specified in DESIGN.md and must not be edited without
 * editing DESIGN.md in the same commit (section 49).
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
    menuCloseLabel: 'Menü schließen',
    searchLabel: 'Suche',
    logoAlt: 'ichbinhier e.V.',
  },

  /** DESIGN.md section 13 */
  hero: {
    tagline: 'ichbinhier, damit Liebe lauter ist',
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

  /**
   * DESIGN.md section 17 — the two fixed routes only. The four Vereinsarbeit
   * categories in between are backend-owned data (`A12`), returned by
   * GET /api/v1/categories, not held here (see API.md and CONTEXT.md,
   * "Category").
   */
  routeLabels: {
    COMMUNITY: 'Bei #ichbinhier mitmachen (Aktionsgruppe)',
    SUPPORTING_MEMBER: 'Fördermitglied werden',
  } satisfies Record<FixedRoute, string>,

  /** DESIGN.md sections 33a to 33c */
  categoriesField: {
    loadingOption: 'Lädt …',
    errorOption: 'Nicht verfügbar',
    error:
      'Die Bereiche für Vereinsarbeit konnten nicht geladen werden. Bitte versuche es noch einmal.',
    retry: 'Erneut versuchen',
    empty: 'Aktuell keine offenen Bereiche für Vereinsarbeit.',
  },

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

  actions: {
    next: 'Weiter',
  },

  /** DESIGN.md section 28 */
  communityPanel: {
    title: 'Du bist sofort dabei.',
    body: 'Kein Warten und keine Rückmeldung nötig: Tritt der Aktionsgruppe bei, lies die Regeln und wähle deinen ersten Thread. Beim ersten Mal antwortest du gemeinsam mit anderen, nie allein.',
    cta: 'Zur Aktionsgruppe',
  },

  /** DESIGN.md section 35 */
  supportingMemberPanel: {
    title: 'Du unterstützt uns direkt.',
    body: 'Ohne Bewerbung und ohne Wartezeit: Wenn du Fördermitglied werden möchtest, findest du hier alle Informationen und den kurzen Antrag. So hilfst du, digitale Zivilcourage langfristig möglich zu machen.',
    cta: 'Zum Förder\u00ADmitglieds\u00ADantrag',
  },

  /** DESIGN.md section 30 */
  confirmation: {
    title: 'Deine Bewerbung ist da!',
    bodyBefore:
      'Wir haben deine Angaben erhalten. Eine Bestätigungs-E-Mail mit allen weiteren Infos ist bereits unterwegs an ',
    bodyAfter: '.',
    closing: 'Vielen Dank für dein Interesse!',
  },

  /** DESIGN.md sections 20 and 32 */
  errors: {
    ROUTE_REQUIRED: 'Bitte wähle aus, wie du uns helfen möchtest',
    CATEGORY_REQUIRED: 'Bitte wähle aus, wie du uns helfen möchtest',
    CATEGORY_UNKNOWN:
      'Diese Auswahl kennen wir nicht — bitte wähle einen der Punkte aus der Liste',
    CATEGORY_UNAVAILABLE:
      'Dieser Bereich ist inzwischen nicht mehr verfügbar. Bitte wähle einen anderen Punkt aus der aktualisierten Liste.',
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
      'Bitte bestätige die Einwilligung, damit wir deine Bewerbung speichern können',
    RATE_LIMITED:
      'Es kamen gerade sehr viele Bewerbungen an. Bitte versuche es in einer Minute noch einmal — deine Angaben bleiben stehen.',
    INTERNAL_ERROR:
      'Das Abschicken hat gerade nicht funktioniert. Bitte versuche es noch einmal — deine Angaben bleiben stehen.',
  } satisfies Record<ErrorCode, string>,

  /** DESIGN.md section 32 — fallback for any error code the applicant form does not know (API.md) */
  unknownError:
    'Das Abschicken hat gerade nicht funktioniert. Bitte versuche es noch einmal — deine Angaben bleiben stehen.',

  /** DESIGN.md sections 33 and 25a */
  a11y: {
    /** Announced via role="status" while the submit request is in flight (section 33) */
    submitting: 'Deine Bewerbung wird abgeschickt.',
    honeypotLabel: 'Dieses Feld bitte leer lassen',
  },

  /** DESIGN.md section 35a — online onboarding checklist (`A32`) */
  onboarding: {
    loading: 'Deine Checkliste wird geladen …',
    invalidTitle: 'Link nicht mehr gültig',
    invalidBody:
      'Dieser Link ist nicht mehr gültig. Schreib uns an info@ichbinhier.online.',
    loadError:
      'Deine Checkliste konnte gerade nicht geladen werden. Bitte lade die Seite noch einmal.',
    saveError:
      'Dein Haken konnte gerade nicht gespeichert werden. Bitte versuche es noch einmal.',
    heading: (name: string) => `Willkommen, ${name}!`,
    intro:
      'Schön, dass du dabei bist. Lies kurz unsere Regeln und hake die vier Schritte in deinem Tempo ab — jeder Haken wird sofort gespeichert.',
    rulesHeading: 'Unsere Regeln',
    rules: [
      'Wir bleiben sachlich und respektvoll, auch wenn andere es nicht sind.',
      'Keine Beleidigungen, keine persönlichen Angriffe, keine Gerüchte.',
      'Gegenrede ist freiwillig. Niemand muss unter Druck schreiben, auch ein Like für einen guten Kommentar hilft.',
      'Achte auf deine eigenen Grenzen. Wenn dich etwas persönlich trifft, tritt einen Schritt zurück.',
    ],
    checklistHeading: 'Deine nächsten Schritte',
    progress: (done: number, total: number) =>
      `${String(done)} von ${String(total)} erledigt`,
    steps: {
      RULES: {
        label: 'Unsere Regeln lesen und bestätigen',
        description:
          'Ich habe die vier Grundregeln oben gelesen und halte mich daran.',
      },
      COMMUNITY_GROUP: {
        label: 'Der #ichbinhier-Gruppe auf Facebook beitreten',
        description:
          'Tritt unserer Aktionsgruppe auf Facebook bei, um dich mit anderen zu vernetzen.',
        linkLabel: 'Zur #ichbinhier-Facebook-Gruppe',
      },
      DIGITAL_DEMOCRACY_LAB: {
        label: 'Level 1 im Digital Democracy Lab machen',
        description:
          '„Leichter Einstieg in digitale Zivilcourage“ — kostenlos und im eigenen Tempo.',
        linkLabel: 'Zum Digital Democracy Lab',
      },
      CONTACT: {
        label: 'Kontakt speichern',
        description:
          'Bei Fragen: info@ichbinhier.online. Für die Community: digitalcourage@ichbinhier.online.',
        linkLabel: 'Kontaktseite von ichbinhier öffnen',
      },
    } satisfies Record<
      OnboardingStepId,
      { label: string; description: string; linkLabel?: string }
    >,
  },

  /** DESIGN.md section 11a */
  footer: {
    contact: {
      title: 'Kontakt',
      talkToUs: 'Sprich mit uns',
      address: ['Postfach 25588', '10129 Berlin', 'info@ichbinhier.online'],
    },
    legal: {
      title: 'Rechtliches',
      imprint: 'Impressum',
      privacy: 'Datenschutz',
    },
    donateLabel: 'Spende hier',
    copyright: (year: number) =>
      `Copyright ${String(year)} ichbinhier e.V. – Alle Rechte vorbehalten.`,
    backToTopLabel: 'Nach oben',
  },
} as const satisfies Content;
