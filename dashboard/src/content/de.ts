/**
 * Every German string a Staff member reads. The dashboard UI is German (`A6`,
 * ADR-0003); code, documents and the glossary stay English. This is the only
 * file in `dashboard/` allowed to hold applicant- or staff-facing German.
 */

import type { FieldErrorCode, TopLevelErrorCode } from '@/domain/apiError';
import type {
  ApplicationStatus,
  ApplicationView,
  WeeklyTime,
} from '@/domain/application';
import {
  INTERNAL_NOTES_MAX_LENGTH,
  STALE_AFTER_DAYS,
} from '@/domain/application';
import {
  CATEGORY_DESCRIPTION_MAX_LENGTH,
  CATEGORY_NAME_MAX_LENGTH,
} from '@/domain/category';

export const de = {
  association: 'ichbinhier',

  /**
   * The three states the application answers once for every screen, rather
   * than each screen answering them again (ADR-0006): the boot fetch, its
   * failure, and whether the live stream is carrying changes.
   *
   * The disconnected wording says what to do about it. `API.md` is explicit
   * that there is no polling fallback — a dashboard that silently displays
   * yesterday's queue is worse than one that admits it is disconnected — and
   * a marker that only admits it, without naming the remedy, leaves the
   * Staff member guessing.
   */
  dashboard: {
    loading: 'Anfragen werden geladen …',
    loadFailed: 'Die Anfragen konnten nicht geladen werden.',
    retry: 'Erneut versuchen',
    /**
     * The dismiss control on the notice a failed write raises. The sentence
     * itself is `errors`: the backend sends a `code` and the dashboard words
     * it in one place (`API.md`, "Errors").
     */
    dismissFailure: 'Meldung ausblenden',
    live: 'Live',
    disconnected: 'Nicht verbunden',
    disconnectedHint: 'Die Liste kann veraltet sein. Bitte lade die Seite neu.',
  },

  overview: {
    welcome: (name: string) => `Willkommen, ${name}!`,
    subtitle:
      'Hier siehst du alle Anfragen zur Vereinsarbeit und sonstigen Anfragen auf einen Blick.',
    stats: {
      new: {
        title: 'Neue Anfragen',
        hint: 'Noch nicht bearbeitet',
      },
      unassigned: {
        title: 'Ohne Zuständigkeit',
        hint: 'Warten auf eine zuständige Person',
      },
      stale: {
        title: 'Lange offen',
        hint: (days: number) => `Länger als ${String(days)} Tage offen`,
      },
    },
    openApplications: {
      title: 'Offene Anfragen',
      searchPlaceholder: 'Name oder E-Mail suchen',
      ownerLabel: 'Zuständigkeit',
      allCategories: 'Alle Kategorien',
      allOwners: 'Alle Zuständigen',
      /**
       * The panel's own two states, worded from "offen" rather than from the
       * whole list: an Application that is Declined or Active is not open, so
       * "keine offenen" can be true while Anfragen is full (issue #53).
       */
      empty: 'Keine offenen Anfragen.',
      emptyHint:
        'Neue Anfragen aus dem Formular erscheinen hier, die ältesten zuerst.',
      noMatches: 'Keine passenden Anfragen.',
      noMatchesHint: 'Suche oder Filter zurücksetzen, um alle zu sehen.',
      count: (shown: number, total: number) =>
        `${String(shown)} von ${String(total)} offenen Anfragen`,
      viewAll: 'Alle offenen Anfragen ansehen',
    },
  },

  navigation: {
    label: 'Hauptnavigation',
    overview: 'Übersicht',
    applications: 'Anfragen',
    categories: 'Kategorien',
    /** The fourth screen: Discarded Applications (`A16`). */
    discarded: 'Aussortiert',
    collapse: 'Navigation einklappen',
    expand: 'Navigation ausklappen',
    openMenu: 'Navigationsmenü öffnen',
    closeMenu: 'Navigationsmenü schließen',
  },

  account: {
    menu: 'Kontomenü',
    viewProfile: 'Profil ansehen',
    settings: 'Einstellungen',
    signOut: 'Abmelden',
  },

  auth: {
    title: 'Anmelden',
    subtitle: 'Melde dich an, um die Anfragen aus dem Formular zu sehen.',
    emailLabel: 'E-Mail',
    emailPlaceholder: 'name@ichbinhier.online',
    passwordLabel: 'Passwort',
    submit: 'Anmelden',

    /**
     * The boot question. The Sign-in is an `HttpOnly` cookie, so whether one
     * exists is `GET /me` rather than something the dashboard can read for
     * itself (`API.md`) — a request, and therefore a wait worth naming.
     */
    checking: 'Anmeldung wird geprüft …',

    /**
     * The cover an expired Sign-in puts over the dashboard (issue #40). It
     * says why the form is here, because "Anmelden" over a dashboard that was
     * working a moment ago reads as a fault rather than as the twelve hours
     * running out (`A17`) — and it promises the work is still there, which is
     * what the cover exists to make true.
     *
     * "Sitzung" is not the word: the glossary spends *Session* on Intro
     * session (`CONTEXT.md`), and the sentence a Staff member reads keeps the
     * same distinction the documents do.
     */
    expiredTitle: 'Anmeldung abgelaufen',
    expiredSubtitle:
      'Melde dich erneut an, um weiterzuarbeiten. Deine Eingaben bleiben erhalten.',

    /**
     * The three wordings the screen can raise on its own, before a request is
     * made — and the reason they are the only ones that sit under a field.
     * Each names the field the Staff member has to change, so the message
     * belongs next to it and that field takes focus.
     *
     * A rejected Sign-in is not among them. `INVALID_CREDENTIALS` and
     * `RATE_LIMITED` are about the submission as a whole — the first refuses
     * to say which of the two fields was wrong, the second says nothing about
     * either — so once a request raises one, `errors.codes` words it above
     * the form rather than under a field (issue #37).
     */
    emailRequired: 'Bitte gib deine E-Mail-Adresse ein.',
    emailInvalid: 'Diese E-Mail-Adresse ist unvollständig.',
    passwordRequired: 'Bitte gib dein Passwort ein.',

    /**
     * Stated instead of a "Passwort vergessen?" link, because there is no
     * reset flow behind such a link — issue #16 owns the one that will be.
     */
    passwordResetHint:
      'Konten legt der Vorstand an, und er setzt auch Passwörter zurück.',
  },

  fields: {
    /** The password input's own visibility toggle, in every form. */
    togglePassword: 'Passwort anzeigen oder verbergen',
    /**
     * The countdown under a capped field. One wording for the Category
     * description and for the internal notes: both count down to a limit the
     * backend enforces too (`API.md`), and two sentences for one idea would
     * drift apart.
     */
    remaining: (count: number) => `Noch ${String(count)} Zeichen`,
  },

  /**
   * What a Staff member reads when a request fails. The backend sends a `code`
   * and no German (`API.md`, "Errors"), so this block is the one place a
   * failure is worded, and `content/errorMessage.ts` is what looks a code up
   * in it. A code neither table names — a `405` Spring raises before a
   * controller sees the body, or one the contract grows later — falls back to
   * `general`, so an unknown code never leaves a screen wordless.
   */
  errors: {
    general: 'Das hat nicht geklappt. Bitte versuche es noch einmal.',

    codes: {
      VALIDATION_FAILED: 'Bitte prüfe die markierten Felder.',
      NOT_DISCARDED:
        'Diese Anfrage ist nicht aussortiert. Die Liste wurde neu geladen.',
      /**
       * One wording for both causes — a wrong password and an address no
       * account has read identically, because the Sign-in refuses to say
       * which of the two it was (`API.md`).
       */
      INVALID_CREDENTIALS: 'E-Mail-Adresse oder Passwort stimmt nicht.',
      UNAUTHENTICATED:
        'Deine Anmeldung ist abgelaufen. Bitte melde dich erneut an.',
      NOT_FOUND:
        'Diesen Eintrag gibt es nicht mehr. Die Liste wurde neu geladen.',
      CATEGORY_IN_USE:
        'Diese Kategorie wird noch von Anfragen genutzt. Deaktiviere sie stattdessen.',
      RATE_LIMITED:
        'Zu viele Versuche. Bitte warte einen Moment und versuche es dann erneut.',
      INTERNAL_ERROR:
        'Beim Server ist etwas schiefgegangen. Bitte versuche es noch einmal.',
    } satisfies Record<TopLevelErrorCode, string>,

    /**
     * Read next to the field the backend names, so each one is a sentence
     * about that field alone. The three limits are the constants the dialog
     * and the notes field count down from — the wording and the input cannot
     * disagree about a number.
     */
    fields: {
      STATUS_UNKNOWN: 'Diesen Status gibt es nicht.',
      OWNER_UNKNOWN: 'Diese zuständige Person gibt es nicht mehr.',
      NOTES_TOO_LONG: `Die Notiz ist zu lang. Höchstens ${String(INTERNAL_NOTES_MAX_LENGTH)} Zeichen.`,
      CATEGORY_NAME_REQUIRED: 'Bitte einen Namen angeben.',
      CATEGORY_NAME_TOO_LONG: `Der Name ist zu lang. Höchstens ${String(CATEGORY_NAME_MAX_LENGTH)} Zeichen.`,
      CATEGORY_NAME_TAKEN: 'Es gibt bereits eine Kategorie mit diesem Namen.',
      CATEGORY_DESCRIPTION_TOO_LONG: `Die Beschreibung ist zu lang. Höchstens ${String(CATEGORY_DESCRIPTION_MAX_LENGTH)} Zeichen.`,
      ORDER_INCOMPLETE:
        'Die Reihenfolge ließ sich nicht speichern. Die Liste wurde neu geladen.',
      IMMUTABLE_FIELD: 'Dieses Feld lässt sich nicht ändern.',
    } satisfies Record<FieldErrorCode, string>,
  },

  applications: {
    eyebrow: 'Engagement',
    title: 'Anfragen',
    subtitle: 'Anfragen aus dem Formular, nach Eingang sortiert.',
    count: (shown: number, total: number) =>
      `${String(shown)} von ${String(total)} Anfragen`,
    /**
     * Not "löschen": the action takes the Application out of the working list
     * and leaves it on the fourth screen (`A16`), and only the button there
     * really deletes. Names the Applicant, because every row carries this one
     * button and one label repeated eight times tells a screen reader nothing
     * about which row it is on.
     */
    discardOne: (name: string) => `Anfrage von ${name} aussortieren`,
    /** Bare while nothing is checked, counted once the selection is non-empty. */
    discardSelected: (count: number) =>
      count === 0 ? 'Aussortieren' : `Aussortieren (${String(count)})`,
    /**
     * Only the bulk action asks. A single row is one click from being back —
     * the fourth screen is the undo — while ticking rows and hitting the bar
     * moves several at once.
     */
    confirmDiscardSelected: (count: number) =>
      count === 1
        ? '1 markierte Anfrage aussortieren?'
        : `${String(count)} markierte Anfragen aussortieren?`,

    /**
     * The first day: the backend runs without the demo week (`A21`), so there
     * is nothing here until somebody submits the form. The hint names the
     * stream, because the next Application really does arrive without a
     * reload.
     */
    empty: 'Noch keine Anfrage eingegangen.',
    emptyHint:
      'Sobald jemand das Formular abschickt, erscheint die Anfrage hier — ohne Neuladen.',
    /** Applications exist, but none in this view, search or filter. */
    noMatches: 'Keine Anfrage in dieser Ansicht.',
    noMatchesHint:
      'Andere Ansicht wählen oder Suche und Filter zurücksetzen. Aussortierte Anfragen liegen unter „Aussortiert“.',
  },

  discarded: {
    eyebrow: 'Ablage',
    title: 'Aussortierte Anfragen',
    subtitle:
      'Anfragen, die aus der Arbeitsliste aussortiert wurden. Sie bleiben mit Status, Zuständigkeit und Kategorie auf Ablage, bis sie wiederhergestellt oder endgültig gelöscht werden.',
    count: (shown: number, total: number) =>
      `${String(shown)} von ${String(total)} aussortierten Anfragen`,

    restore: 'Wiederherstellen',
    restoreOne: (name: string) => `Anfrage von ${name} wiederherstellen`,
    /** Bare while nothing is checked, counted once the selection is non-empty. */
    restoreSelected: (count: number) =>
      count === 0 ? 'Wiederherstellen' : `Wiederherstellen (${String(count)})`,

    erase: 'Endgültig löschen',
    eraseOne: (name: string) => `Anfrage von ${name} endgültig löschen`,
    eraseSelected: (count: number) =>
      count === 0
        ? 'Endgültig löschen'
        : `Endgültig löschen (${String(count)})`,
    /**
     * Both confirmations name the consequence: this is the only action in the
     * dashboard that erases what a person wrote, and there is no undo behind
     * it (`A16`).
     */
    confirmEraseOne: (name: string) =>
      `Anfrage von ${name} endgültig löschen? Das lässt sich nicht rückgängig machen.`,
    confirmEraseSelected: (count: number) =>
      count === 1
        ? '1 markierte Anfrage endgültig löschen? Das lässt sich nicht rückgängig machen.'
        : `${String(count)} markierte Anfragen endgültig löschen? Das lässt sich nicht rückgängig machen.`,

    empty: 'Nichts aussortiert.',
    emptyHint:
      'Hier liegen die Anfragen, die in „Anfragen“ aussortiert wurden.',
    noMatches: 'Keine aussortierte Anfrage entspricht dieser Suche.',
    noMatchesHint:
      'Suche zurücksetzen, um alle aussortierten Anfragen zu sehen.',
  },

  categories: {
    eyebrow: 'Formular',
    title: 'Kategorien',
    subtitle:
      'Die Auswahl, die Interessierte im Formular sehen. Eine Änderung hier wirkt sofort auf das Formular.',
    count: (shown: number, total: number) =>
      `${String(shown)} von ${String(total)} Kategorien`,

    summary: {
      total: 'Kategorien insgesamt',
      totalHint: 'Angelegt, aktiv oder nicht',
      active: 'Im Formular wählbar',
      activeHint: 'Aktive Kategorien',
      unused: 'Ohne Anfragen',
      unusedHint: 'Bisher nie ausgewählt',
    },

    views: {
      all: 'Alle',
      active: 'Aktiv',
      inactive: 'Inaktiv',
    },

    columns: {
      order: 'Reihenfolge',
      name: 'Kategorie',
      status: 'Im Formular',
      usage: 'Anfragen',
      actions: 'Aktionen',
    },

    tableTitle: 'Reihenfolge im Formular',
    tableDescription:
      'Interessierte sehen die aktiven Kategorien in genau dieser Reihenfolge.',

    add: 'Kategorie hinzufügen',
    edit: 'Bearbeiten',
    editOne: (name: string) => `${name} bearbeiten`,
    delete: 'Löschen',
    deleteOne: (name: string) => `${name} löschen`,
    confirmDelete: (name: string) => `Kategorie „${name}“ wirklich löschen?`,

    moveUp: 'Nach oben',
    moveDown: 'Nach unten',
    moveUpOne: (name: string) => `${name} nach oben schieben`,
    moveDownOne: (name: string) => `${name} nach unten schieben`,
    /** Reordering needs the whole list; search and the tabs hide part of it. */
    moveBlocked: 'Reihenfolge nur in der Ansicht „Alle“ ohne Suche änderbar',

    active: 'Aktiv',
    inactive: 'Inaktiv',
    toggleOne: (name: string) => `${name} im Formular anzeigen`,

    noDescription: 'Keine Beschreibung',
    usageCount: (count: number) =>
      count === 1 ? '1 Anfrage' : `${String(count)} Anfragen`,
    /** A Category behind Applications is deactivated, never deleted (`A15`). */
    deleteBlocked: (count: number) =>
      count === 1
        ? 'Nicht löschbar: 1 Anfrage nutzt diese Kategorie. Stattdessen deaktivieren.'
        : `Nicht löschbar: ${String(count)} Anfragen nutzen diese Kategorie. Stattdessen deaktivieren.`,

    empty: 'Noch keine Kategorie angelegt.',
    emptyHint:
      'Lege die erste Kategorie an, damit das Formular eine Auswahl anbieten kann.',
    noMatches: 'Keine Kategorie entspricht dieser Auswahl.',
    noMatchesHint: 'Andere Ansicht wählen oder die Suche zurücksetzen.',

    dialog: {
      createTitle: 'Neue Kategorie',
      createSubtitle:
        'Sobald sie aktiv ist, erscheint sie unten im Formular zur Auswahl.',
      editTitle: 'Kategorie bearbeiten',
      editSubtitle:
        'Änderungen gelten für das Formular und für alle bestehenden Anfragen.',
      name: 'Name',
      namePlaceholder: 'z. B. Social Media',
      nameHint: 'So steht die Kategorie im Formular.',
      description: 'Beschreibung',
      descriptionPlaceholder: 'Kurz erklärt, wofür diese Kategorie steht.',
      descriptionHint: 'Optional, eine Zeile unter dem Namen.',
      activeLabel: 'Im Formular anzeigen',
      activeHint:
        'Inaktive Kategorien bleiben erhalten, sind aber nicht wählbar.',
      preview: 'So sieht es im Formular aus',
      previewInactive: 'Inaktiv — im Formular derzeit ausgeblendet.',
      create: 'Anlegen',
      save: 'Speichern',
      cancel: 'Abbrechen',
      close: 'Schließen',
      /*
       * No wording here for the dialog's own two checks: the backend answers
       * `CATEGORY_NAME_REQUIRED` and `CATEGORY_NAME_TAKEN` for the same two
       * failures, and one failure is worded once — in `errors.fields`. The
       * description's countdown is `fields.remaining`, shared with the
       * internal notes.
       */
    },
  },

  /**
   * The pager under a table. The clone ships these strings in English inside
   * the component; they are copy a Staff member reads, so they live here and
   * `PaginationCardDefault` takes them from this file.
   */
  pagination: {
    previous: 'Zurück',
    next: 'Weiter',
    /**
     * The narrow-screen counter, where the numbered pages do not fit. Kept as
     * one sentence with placeholders rather than three fragments the component
     * concatenates — the pager sets both numbers in medium weight, and it is
     * the sentence, not the code, that decides where they sit.
     */
    position: 'Seite {page} von {total}',
    /** Accessible name of a numbered page button. */
    page: (page: number) => `Seite ${String(page)}`,
  },

  views: {
    all: 'Alle',
    unassigned: 'Nicht zugewiesen',
    stale: `Älter als ${String(STALE_AFTER_DAYS)} Tage`,
  } satisfies Record<ApplicationView, string>,

  filters: {
    search: 'Suche',
    category: 'Kategorie',
    status: 'Status',
    all: 'Alle',
    filter: 'Filter',
    apply: 'Anwenden',
    reset: 'Filter zurücksetzen',
  },

  columns: {
    submittedAt: 'Eingegangen',
    name: 'Name',
    email: 'E-Mail',
    category: 'Kategorie',
    weeklyTime: 'Verfügbarkeit',
    status: 'Status',
    owner: 'Zuständig',
    actions: 'Aktionen',
  },

  statuses: {
    NEW: 'Neu',
    IN_REVIEW: 'In Prüfung',
    INTRO_BOOKED: 'Info-Runde gebucht',
    ACTIVE: 'Aktiv',
    WAITLISTED: 'Warteliste',
    DECLINED: 'Abgelehnt',
  } satisfies Record<ApplicationStatus, string>,

  /**
   * The four time bands the form offers, worded as the form words them
   * (`frontend/src/content/de.ts`) so a Staff member reads what the Applicant
   * picked. They carry no "pro Woche" suffix: `IRREGULAR` is not a quantity,
   * and the Verfügbarkeit column and the drawer's chip already say which
   * question these answer.
   */
  weeklyTimes: {
    HOURS_1_2: '1–2 Stunden',
    HOURS_3_5: '3–5 Stunden',
    HOURS_5_PLUS: 'mehr als 5 Stunden',
    IRREGULAR: 'unregelmäßig, projektweise',
  } satisfies Record<WeeklyTime, string>,

  application: {
    unassigned: 'Nicht zugewiesen',
    daysAgo: (days: number) =>
      days === 0
        ? 'Heute'
        : days === 1
          ? 'Gestern'
          : `vor ${String(days)} Tagen`,
  },

  detail: {
    title: 'Anfrage',
    close: 'Schließen',
    /** Heading over the two controls that change the Application itself. */
    workflow: 'Workflow',
    about: 'Nachricht',
    internalNotes: 'Interne Notizen',
    /** Stated as a hint, not as placeholder text, so it survives the first keystroke. */
    notesHint: 'Nur für Mitarbeitende sichtbar',
    notesPlaceholder: 'Notiz hinzufügen …',
    consent: 'Einwilligung',
    consentAt: 'Erteilt am',
    consentTextVersion: 'Datenschutzerklärung',
    consentTextVersionValue: (version: string) => `Version ${version}`,
    owner: 'Zuständig',
    status: 'Status',
    writeMail: 'E-Mail schreiben',
    copyMail: 'E-Mail-Adresse kopieren',
    /** The footer button's visible label; `copyMail` stays its accessible name. */
    copyMailShort: 'Kopieren',
    copied: 'Kopiert',
  },
} as const;
